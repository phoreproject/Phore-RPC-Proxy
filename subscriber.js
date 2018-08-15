const request = require('request'),
    config = require('./config.js'),
    eventNames = require('./eventNames.js');


function createJsonData(method) {
    let args = [];
    for (let i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    return {"jsonrpc": "2.0", "method": method, "params": args, "id": 1}
}

function createBasicAuthHeader() {
    return {
        Authorization: "Basic " + Buffer.from(config.rpc_user + ":" + config.rpc_pass).toString("base64")
    }
}

function sendRpcCall(rpcCommand, callback, ...arg) {
    return request.post(config.phored_host + ':' + config.phored_rpc_port, {
        headers: createBasicAuthHeader(),
        json: createJsonData(rpcCommand, arg),
    }, callback);
}

function downloadBlock(blockHash, callback) {
    return sendRpcCall(eventNames.rpc.getblock, callback, blockHash);
}

function downloadRawTransaction(txHash, callback) {
    // set verbose to true (last parameter = 1)
    return sendRpcCall(eventNames.rpc.getrawtransaction, callback, txHash, 1);
}


class BloomFilter {
    constructor(filterHex, hashFunc, tweak, flags) {
        this.filterHex = filterHex;
        this.hashFunc = hashFunc;
        this.tweak = tweak;
        this.flags = flags;
    }
}

class Subscriber {
    constructor() {
        this.clientIds = {};
        this.subscribedToAddressMempool = {};
        this.subscribedToAddress = {};
        this.subscribedToBloomMempool = {};
        this.subscribedToBloom = {};
    }

    broadcastAddressMessage(address, tx, mempool) {

    }

    broadcastTransactionMessage(tx, mempool, message) {

    }

    parseRawTransactionForAddress(err, res, body, mempool){
        if(err){
            console.log(err);
        }
        else if (res && res.statusCode !== 200) {
            return console.log("Failed download", eventNames.rpc.getrawtransaction, "with params:", tx,
                "because", body.error.message);
        }

        if (body.result === undefined ||
            body.result['tx'] === undefined ||
            body.result['tx']['vout'] === undefined){
            console.log("Transaction wrong format: ", body.result);
            return;
        }

        for (let tx in body.result["tx"]["vout"]) {
            if (!body.result["tx"]["vout"].hasOwnProperty(tx)) {
                continue;
            }

            //TODO
            // this.broadcastTransactionMessage(body.result["tx"]["hex"], mempool, "");

            if (tx["scriptPubKey"] === undefined || tx["scriptPubKey"]["addresses"] === undefined){
                continue;
            }

            for (let address in tx["scriptPubKey"]["addresses"]) {
                if (!tx["scriptPubKey"]["addresses"].hasOwnProperty(address)){
                    continue;
                }
                // TODO tx? check
                this.broadcastAddressMessage(address, tx, mempool);
            }
        }
    }

    processRawTransaction(err, res, body) {
        return this.parseRawTransactionForAddress(err, res, body, false);
    }

    processRawMempoolTransaction(err, res, body) {
        return this.parseRawTransactionForAddress(err, res, body, true);
    }

    processTxs(txs) {
        for (let tx in txs) {
            if (!txs.hasOwnProperty(tx)) {
                continue;
            }
            // get raw transactions from phored
            downloadRawTransaction(tx, this.processRawTransaction);
        }
    }

    processMempoolTx(tx) {
        downloadRawTransaction(tx, this.processRawMempoolTransaction);
    }

    async processBlockNotifyEvent(blockHash) {
        return new Promise((resolve, reject) => {
            // gen info about block from phored
            downloadBlock(blockHash,
                (err, res, body) => {
                    if (err) {
                        return reject(err);
                    }
                    else if (res && res.statusCode !== 200) {
                        return reject("Failed download", eventNames.rpc.getblock, "with params:", blockHash || "empty",
                            "because", body.error.message);
                    }

                    if (body.result['tx'] !== undefined) {
                        this.processTxs(body.result['tx']);
                    }

                    console.log("Success download", eventNames.rpc.getblock, "with params:", blockHash || "empty");
                    resolve(body.result);
                });
        }).catch((err) => {
            console.log(err);
        });
    }

    processMemPoolEvent(txHash) {
        this.processMempoolTx(txHash);
    }

    static appendToDict(dict, key, value) {
        if (key in dict) {
            dict[key].append(value);
        }
        else {
            dict[key] = [value];
        }
    }

    static removeIfExists(dict, element) {
        for (let key in dict) {
            if (dict.hasOwnProperty(key)) {
                const index = dict[key].indexOf(element);
                if (index !== -1) {
                    dict[key].splice(index, 1);
                }
                if (dict[key].length() === 0) {
                    delete dict[key];
                }
            }
        }
    }

    unsubscribeAll(socket) {
        delete this.clientIds[socket.id];
        Subscriber.removeIfExists(this.subscribedToAddressMempool, socket.id);
        Subscriber.removeIfExists(this.subscribedToAddress, socket.id);
    }

    subscribeAddress(socket, address, includeMempool) {
        this.clientIds[socket.id] = socket;

        if (includeMempool === eventNames.includeTransactionType.include_all) {
            Subscriber.appendToDict(this.subscribedToAddressMempool, address, socket.id);
            Subscriber.appendToDict(this.subscribedToAddress, address, socket.id);
        } else if (includeMempool === eventNames.includeTransactionType.only_confirmed) {
            Subscriber.appendToDict(this.subscribedToAddress, address, socket.id);
        } else {
            Subscriber.appendToDict(this.subscribedToAddressMempool, address, socket.id);
        }
    }

    subscribeBloom(socket, filterHex, hashFunc, tweak, includeMempool, flags) {
        this.clientIds[socket.id] = socket;
        const bloomFilter = new BloomFilter(filterHex, hashFunc, tweak, flags);
        if (includeMempool === eventNames.includeTransactionType.include_all) {
            Subscriber.appendToDict(this.subscribedToBloomMempool, bloomFilter, socket.id);
            Subscriber.appendToDict(this.subscribedToBloom, bloomFilter, socket.id);
        } else if (includeMempool === eventNames.includeTransactionType.only_confirmed) {
            Subscriber.appendToDict(this.subscribedToBloom, bloomFilter, socket.id);
        } else {
            Subscriber.appendToDict(this.subscribedToBloomMempool, bloomFilter, socket.id);
        }
    }
}

module.exports = {
    Subscriber: Subscriber
};

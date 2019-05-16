const eventNames = require('./eventNames.js'),
    tools = require('./tools'),
    bloomFilter = require('bloom-filter');


class SubscribeManager {
    constructor() {
        this.clientIds = {};

        this.subscribedToAddressMempool = {};
        this.subscribedToAddress = {};
        this.subscribedToBloomMempool = {};
        this.subscribedToBloom = {};

        this.subscribedToBlock = new Set();
        this.subscribedToBlockHash = new Set();
    }

    async broadcastAddressMessage(addresses, tx, mempool) {
        let subscribedDict = this.subscribedToAddress;
        if (mempool) {
            subscribedDict = this.subscribedToAddressMempool;
        }

        for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
            const address = addresses[addressIndex];

            if (!(address in subscribedDict)) {
                console.log("Nobody subscribed to address:", address);
                continue;
            }

            for (let subIndex = 0; subIndex < subscribedDict[address].length; subIndex++) {
                const userId = subscribedDict[address][subIndex];

                if (!(this.clientIds.hasOwnProperty(userId))) {
                    console.log("User id:", userId, "is missing!");
                    continue;
                }

                this.clientIds[userId].send(tx);
            }
        }
    }

    async broadcastBloomMessage(addresses, tx, mempool) {
        let subscribedDict = this.subscribedToBloom;
        if (mempool) {
            subscribedDict = this.subscribedToBloomMempool;
        }

        for (let userId in this.clientIds) {
            if (!this.clientIds.hasOwnProperty(userId)) {
                continue;
            }

            if (!(userId in subscribedDict)) {
                continue;
            }

            for (let filterId = 0; filterId < subscribedDict[userId].length; filterId++) {
                const filter = subscribedDict[userId][filterId];

                for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
                    if (filter.contains(addresses[addressIndex])) {
                        this.clientIds[userId].send(tx);
                    }
                }
            }
        }
    }

    async parseRawTransactionForAddress(txHash, err, res, body, mempool){
        if(err){
            console.log(err);
        }
        else if (res && res.statusCode !== 200) {
            return console.log("Failed download", eventNames.rpc.getrawtransaction, "with params:", txHash,
                "because", body.error.message);
        }

        if (body.result === undefined ||
            body.result['vout'] === undefined){
            console.log("Transaction wrong format: ", body.result);
            return;
        }

        for (let i = 0; i < body.result["vout"].length; i++) {
            const tx = body.result["vout"][i];

            if (tx["scriptPubKey"] === undefined || tx["scriptPubKey"]["addresses"] === undefined){
                continue;
            }

            this.broadcastAddressMessage(tx["scriptPubKey"]["addresses"], body.result, mempool);
            this.broadcastBloomMessage(tx["scriptPubKey"]["addresses"], body.result, mempool);
        }
    }

    processTxs(txs) {
        for (let i = 0; i < txs.length; i++) {
            // get raw transactions from phored
            tools.downloadRawTransactionVerbose(txs[i], (err, res, body) => {
                return this.parseRawTransactionForAddress(txs[i], err, res, body, false);
            });
        }
    }

    processMempoolTx(tx) {
        tools.downloadRawTransactionVerbose(tx, (err, res, body) => {
            return this.parseRawTransactionForAddress(tx, err, res, body, true);
        });
    }

    async processNewBlockEvent(blockHash) {
        // send new block to all subscribed clients
        this.subscribedToBlockHash.forEach((clientId) => {
            if (this.clientIds.hasOwnProperty(clientId)) {
                this.clientIds[clientId].send(blockHash);
            }
        });

        const block = await this.processBlockNotifyEvent(blockHash);
        if (block != null) {
            this.subscribedToBlock.forEach((clientId) => {
                if (this.clientIds.hasOwnProperty(clientId)) {
                    this.clientIds[clientId].send(block);
                }
            })
        }
    }

    async processBlockNotifyEvent(blockHash) {
        return new Promise((resolve, reject) => {
            // gen info about block from phored
            tools.downloadBlock(blockHash,
                (err, res, body) => {
                    if (err) {
                        return reject(err);
                    }
                    else if ((res && res.statusCode !== 200) || body.error !== null) {
                        let errorMsg = (body.error !== undefined && body.error.message !== undefined) ?
                            body.error.message : "empty";
                        return reject("Failed download " + eventNames.rpc.getblock + "(" + (res.statusCode)
                            + ") with params: " + (blockHash || "empty") + ", because: " + errorMsg);
                    }

                    if (body.result !== null && body.result['tx'] !== undefined) {
                        this.processTxs(body.result['tx']);
                    }
                    else {
                        console.log("Unknown error");
                        return reject("Unknown error");
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

    static removeIfValueExists(dict, dictValue) {
        for (let key in dict) {
            if (dict.hasOwnProperty(key)) {
                const index = dict[key].indexOf(dictValue);
                if (index !== -1) {
                    dict[key].splice(index, 1);
                }
                if (dict[key].length === 0) {
                    delete dict[key];
                }
            }
        }
    }

    static removeIfKeyExists(dict, key) {
        if (key in dict) {
            delete dict[key];
        }
    }

    unsubscribeAll(socket) {
        SubscribeManager.removeIfKeyExists(this.clientIds, socket.id);
        SubscribeManager.removeIfValueExists(this.subscribedToAddressMempool, socket.id);
        SubscribeManager.removeIfValueExists(this.subscribedToAddress, socket.id);
        SubscribeManager.removeIfKeyExists(this.subscribedToBloom, socket.id);
        SubscribeManager.removeIfKeyExists(this.subscribedToBloomMempool, socket.id);
        this.subscribedToBlockHash.delete(socket.id);
        this.subscribedToBlock.delete(socket.id);
    }

    subscribeBlockHash(socket) {
        this.clientIds[socket.id] = socket;
        this.subscribedToBlockHash.add(socket.id);
    }

    subscribeBlock(socket) {
        this.clientIds[socket.id] = socket;
        this.subscribedToBlock.add(socket.id);
    }

    subscribeAddress(socket, address, includeMempool) {
        this.clientIds[socket.id] = socket;

        if (includeMempool === eventNames.includeTransactionType.include_all) {
            SubscribeManager.appendToDict(this.subscribedToAddressMempool, address, socket.id);
            SubscribeManager.appendToDict(this.subscribedToAddress, address, socket.id);
        } else if (includeMempool === eventNames.includeTransactionType.only_confirmed) {
            SubscribeManager.appendToDict(this.subscribedToAddress, address, socket.id);
        } else {
            SubscribeManager.appendToDict(this.subscribedToAddressMempool, address, socket.id);
        }
    }

    subscribeBloom(socket, filterHex, hashFunc, tweak, includeMempool, flags) {
        this.clientIds[socket.id] = socket;
        const filter = new bloomFilter({
            vData: filterHex,
            nHashFuncs: hashFunc,
            nTweak: tweak,
            nFlags: flags,
        });
        if (includeMempool === eventNames.includeTransactionType.include_all) {
            SubscribeManager.appendToDict(this.subscribedToBloomMempool, socket.id, filter);
            SubscribeManager.appendToDict(this.subscribedToBloom, socket.id, filter);
        } else if (includeMempool === eventNames.includeTransactionType.only_confirmed) {
            SubscribeManager.appendToDict(this.subscribedToBloom, socket.id, filter);
        } else {
            SubscribeManager.appendToDict(this.subscribedToBloomMempool, socket.id, filter);
        }
    }
}

module.exports = {
    Subscriber: SubscribeManager
};

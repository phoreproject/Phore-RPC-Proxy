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

class BloomFilter {
    constructor(filterHex, hashFunc, tweak, flags){
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

    async processBlockNotifyEvent(message) {
        return new Promise((resolve, reject) => {
            // gen info about block from phored
            request.post(config.phored_host + ':' + config.phored_rpc_port, {
                    headers: createBasicAuthHeader(),
                    json: createJsonData(eventNames.rpc.getblock, message)
                },
                (err, res, body) => {
                    if (err) {
                        return reject(err);
                    }
                    else if (res && res.statusCode !== 200) {
                        return reject("Failed download", eventNames.rpc.getblock, "with params:", message || "empty", "because", body.error.message);
                    }

                    console.log("Success download", eventNames.rpc.getblock, "with params:", message || "empty");
                    return resolve(body.result);
                });
        }).catch((err) => {
            console.log(err);
        });
    }

    async processMemPoolEvent(message) {

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
        for(let key in dict) {
            if (dict.hasOwnProperty(key)){
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

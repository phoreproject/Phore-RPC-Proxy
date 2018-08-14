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

class Subscriber {
    constructor() {

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

    unsubscribeAll(socket) {

    }

    subscribeAddress(socket, address, includeMempool) {

    }

    subscribeBloom(socket, filterHex, hashFunc, tweak, includeMempool, flags) {

    }
}

module.exports = {
    Subscriber: Subscriber
};

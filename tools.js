const eventNames = require('./eventNames'),
    config = require('./config'),
    request = require('request');

function createJsonData(method) {
    let args = [];
    for (let i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    return {"jsonrpc": "2.0", "method": method, "params": args, "id": 1}
}

function createBasicAuthHeader() {
    if (config.rpc_pass == null || config.rpc_user == null) {
        return {};
    }
    return {
        Authorization: "Basic " + Buffer.from(config.rpc_user + ":" + config.rpc_pass).toString("base64")
    }
}

function sendRpcCall(rpcCommand, callback, ...arg) {
    return request.post({
        url: config.phored_host,
        path: config.phored_rpc_path,
        port: config.phored_rpc_port,
        headers: createBasicAuthHeader(),
        json: createJsonData(rpcCommand, ...arg),
    }, callback);
}

module.exports = {
    // Convert a hex string to a byte array
    hexToBytes: function (hex) {
        let bytes = [];
        for (let c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    },

    // Convert a byte array to a hex string
    bytesToHex: function (bytes) {
        let hex = [];
        for (let i = 0; i < bytes.length; i++) {
            hex.push((bytes[i] >>> 4).toString(16));
            hex.push((bytes[i] & 0xF).toString(16));
        }
        return hex.join("");
    },

    downloadBlock: function (blockHash, callback) {
        return sendRpcCall(eventNames.rpc.getblock, callback, blockHash);
    },

    downloadRawTransactionVerbose: function (txHash, callback) {
        // set verbose to true (last parameter = 1)
        return sendRpcCall(eventNames.rpc.getrawtransaction, callback, txHash, 1);
    },
};

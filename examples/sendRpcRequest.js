let config = require('../config.js'),
    tools = require('../tools'),
    request = require('request');

function createJsonData(method) {
    let args = [];
    for (let i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    return {"jsonrpc": "2.0", "method": method, "params": args, "id": 1}
}

async function postHttp(method, ...args) {
    return new Promise((resolve, reject) => {
        request.post(tools.createUri(),
            {
                headers: tools.createBasicAuthHeader(),
                json: createJsonData(method, ...args),
            },
            (err, res, body) => {
                if (err || res.statusCode !== 200) {
                    if (res) {
                        return reject(res);
                    }
                    else {
                        return reject(err);
                    }
                }
                return resolve(body.result);
            });
    }).catch((err) => {
        console.log(err);
    });
}

async function downloadBlockTransactions(blockHash) {
    const block = await postHttp("getblock", blockHash);

    for (let i = 0; i < block['tx'].length; i++) {
        const transaction = await postHttp("getrawtransaction",
            block['tx'][i], 1); // 1 for verbose mode

        console.log(transaction);
    }
}

async function downloadBestBlockTransactions() {
    const blockhash = await postHttp("getbestblockhash");

    await downloadBlockTransactions(blockhash);
}


//example usage
downloadBestBlockTransactions();
// or
downloadBlockTransactions("f130fc80fffec43e66f0d236d4d0ccb2cacf9284f0910256f6b39161b89a8375");
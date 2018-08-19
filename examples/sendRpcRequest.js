let config = require('../config.js'),
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
        request.post('http://127.0.0.1:11772', {
                headers: {Authorization: "Basic " + Buffer.from(config.rpc_user + ":" + config.rpc_pass).toString("base64")},
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

async function downloadBestBlockTransactions() {
    const blockhash = await postHttp("getbestblockhash");

    const block = await postHttp("getblock", blockhash);

    for(let i = 0; i < block['tx'].length; i++) {
        const transaction = await postHttp("getrawtransaction",
            block['tx'][i], 1); // 1 for verbose mode

        console.log(transaction);
    }
}

downloadBestBlockTransactions();

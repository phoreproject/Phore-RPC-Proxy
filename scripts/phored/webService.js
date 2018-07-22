let config = require('./config.js'),
    express = require('express'),
    request = require('request');

function sendRPCCommand(response, method, params=[]) {
    request.post(config.phored_host + ':' + config.phored_rpc_port, {
            headers: {Authorization: "Basic " + Buffer.from(config.rpc_user + ":" + config.rpc_pass).toString("base64")},
            json: {"jsonrpc": "2.0", "method": method, "params": params, "id": 1}
        },
        (err, res, body) => {
            if (err || res.statusCode !== 200) {
                if (res) {
                    response.status(res.statusCode).send(err);
                }
                else {
                    response.status(400).send(err);
                }
            }
            response.send("Success");
        });
}

const AllowedMethods = new Set([
    'getbestblockhash',
    'getblock',
    'getblockchaininfo',
    'getblockcount',
    'getblockhash',
    'getblockheader',
    'getchaintips',
    'getdifficulty',
    'getmempoolinfo',
    'getrawmempool',
    'gettxout',
    'gettxoutsetinfo',
    'getinfo',
    'getmininginfo',
    'getnetworkhashps',
    'submitblock',
    'getconnectioncount',
    'ping',
    'masternodelist',
    'getrawtransaction',
    'sendrawtransaction',
    'estimatefee',
    'estimatepriority',
]);

class MethodNotAllowedError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, MethodNotAllowedError);
    }
}

function main() {
    let app = express();
    app.use(express.json());
    app.use((err, req, res, next) => {
        console.log(err);
        res.sendStatus(err.statusCode).json(err)
    });

    app.post('/rpc', (req, res, next) => {
        const method = req.body.method;
        if (method === undefined) {
            let error = new Error("Method parameter is missing from body");
            error.statusCode = 400;
            return next(error);
        }

        if (!AllowedMethods.has(method)) {
            let error = new MethodNotAllowedError("Forbidden to run command " + method);
            error.statusCode = 403;
            return next(error);
        }

        try {
            sendRPCCommand(res, method, req.body.params || []);
        }
        catch (e) {
            res.status(500).send(e);
        }
    });

    app.all('*', (req, res) => {
        console.log("Health check");
        try {
            sendRPCCommand(res, "ping");
        }
        catch (e) {
            res.status(408).send(e)
        }
    });
    app.listen(config.web_port);
    console.log("App is running state");
}

main();

let config = require('./config.js'),
    express = require('express'),
    request = require('request');

function pingPhored(response) {
    request.post(config.phored_host + ':' + config.phored_port, {
            headers: { Authorization: "Basic " + Buffer.from(config.rpc_user + ":" + config.rpc_pass).toString("base64") },
            json: {"jsonrpc": "2.0", "method": "ping", "params": [], "id": 1}
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

async function main() {
    let app = express();
    app.get('*', (req, res) => {
        try {
            pingPhored(res);
        }
        catch (e) {
            res.status(408).send("Timeout")
        }
    });
    app.listen(80);
}

main();
const config = require('./config.js'),
    eventNames = require('./eventNames.js'),
    subscribeClass = require('./subscriber'),
    tools = require("./tools.js"),
    express = require('express'),
    redis = require('redis'),
    WebSocket = require('ws'),
    http = require('http');

console.log("App version: " + require("./package").version);

// config express app
const app = express();
app.use(express.static('static'));

const server = http.createServer(app);
server.listen(config.web_port, () => {
    console.log("App listen on port " + config.web_port);
});
console.log("Download url: " + tools.createUri());

// config websockets
const wss = new WebSocket.Server({server});

// config subscriber
const subscriber = new subscribeClass.Subscriber();

// config redis
const redisClient = redis.createClient(config.redis_port, config.redis_host);
redisClient.subscribe(eventNames.redis.blocknotify);
redisClient.subscribe(eventNames.redis.mempoolnotify);

// new block appeared
redisClient.on('message', async (channel, message) => {
    // write to all subscribed clients
    setTimeout(() => {
        if (channel === eventNames.redis.blocknotify) {
            subscriber.processNewBlockEvent(message);
        }
        else if (channel === eventNames.redis.mempoolnotify) {
            subscriber.processMemPoolEvent(message);
        }
    }, 30000);
});

let wsConnectionCnt = 0;
// websocket part
wss.on('connection', (ws, req) => {
    ws.id = "ws-id-" + wsConnectionCnt++;
    ws.isAlive = true;

    ws.on('ping', ()  => {
        ws.isAlive = true;
    });

    ws.on('pong', ()  => {
        ws.isAlive = true;
    });

    ws.on('message', (message) => {
        ws.isAlive = true;
        if (message.startsWith(eventNames.subscriptions.subscribeBlockHash)) {
            console.log("Client", ws.id, "subscribed to new blocks hash notification");
            subscriber.subscribeBlockHash(ws);
        }
        else if (message.startsWith(eventNames.subscriptions.subscribeBlock)) {
            console.log("Client", ws.id, "subscribed to new blocks notification");
            subscriber.subscribeBlock(ws);
        }
        else if (message.startsWith(eventNames.subscriptions.subscribeAddress)) {
            console.log("Client", ws.id, "subscribe to new address notification");
            let address;
            let includeMempool;

            let splitted = message.split(" ");
            if (splitted.length !== 3) {
                return ws.send("error: Incorrect number of arguments");
            }
            address = splitted[1];

            includeMempool = parseInt(splitted[2]);
            if (isNaN(includeMempool)) {
                return ws.send("error:" + splitted[2] + "is not a number");
            }

            if (!(includeMempool in Object.values(eventNames.includeTransactionType))) {
                return ws.send("error: includeMempool has unsupported value: " + includeMempool +
                    ", correct values are: " +  Object.values(eventNames.includeTransactionType));
            }

            subscriber.subscribeAddress(ws, address, includeMempool);
        }
        else if (message.startsWith(eventNames.subscriptions.subscribeBloom)) {
            let splitted = message.split(" ");
            if (splitted.length < 5 || splitted.length > 6) {
                return ws.send("error: Incorrect number of arguments");
            }

            let filterHex = tools.hexToBytes(splitted[1]);
            let hashFunc = parseInt(splitted[2]);
            let tweak = parseInt(splitted[3]);
            let includeMempool = parseInt(splitted[4]);
            let flags = eventNames.bloomUpdateType.None;

            if (splitted.length === 6) {
                flags = parseInt(splitted[5]);

                if (isNaN(flags)) {
                    return ws.send("error: flags parameter" + splitted[5] + "is not a number");
                }
            }

            if (isNaN(hashFunc)) {
                return ws.send("error: hashFunc parameter" + splitted[2] + "is not a number");
            }

            if (isNaN(tweak)) {
                return ws.send("error: tweak parameter" + splitted[3] + "is not a number");
            }

            if (isNaN(includeMempool)) {
                return ws.send("error: includeMempool parameter" + splitted[4] + "is not a number");
            }

            if (!(flags in Object.values(eventNames.bloomUpdateType))) {
                return ws.send("error: includeMempool has unsupported value: " + includeMempool +
                    ", correct values are: " + Object.values(eventNames.bloomUpdateType));
            }

            if (!(includeMempool in Object.values(eventNames.includeTransactionType))) {
                return ws.send("error: includeMempool has unsupported value: " + includeMempool +
                    ", correct values are: " +  Object.values(eventNames.includeTransactionType));
            }

            subscriber.subscribeBloom(ws, filterHex, hashFunc, tweak, includeMempool, flags)
        }
        else if (message.startsWith(eventNames.subscriptions.unsubscribeAll)) {
            subscriber.unsubscribeAll(ws);
        }
        ws.send("success");
    });
});

setInterval(function ping() {
    wss.clients.forEach(function (ws) {
        if (ws.isAlive === false) {
            subscriber.unsubscribeAll(ws);
            return ws.close(4000);
        }

        ws.isAlive = false;
        ws.ping();
    });
}, 300000);

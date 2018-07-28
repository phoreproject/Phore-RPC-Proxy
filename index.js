const express = require('express'),
    socketio = require('socket.io'),
    config = require('./config.js'),
    socketioRedis = require('socket.io-redis'),
    redis = require('redis'),
    eventNames = require('./eventNames.js'),
    request = require('request');

let app = express();
let server = app.listen(config.web_port);
let io = socketio(server);

app.use(express.static('static'));
let redisIO = socketioRedis({
    host: config.redis_host, port: config.redis_port,
    subClient: redis.createClient(config.redis_port, config.redis_host),
    pubClient: redis.createClient(config.redis_port, config.redis_host)
});
redisIO.subClient.subscribe(eventNames.redis.blocknotify);
io.adapter(redisIO);


function createJsonData(method) {
    let args = [];
    for (let i = 1; i < arguments.length; i++) {
        console.log(arguments[i]);
        args.push(arguments[i]);
    }
    return {"jsonrpc": "2.0", "method": method, "params": args, "id": 1}
}

function createBasicAuthHeader() {
    return {
        Authorization: "Basic " + Buffer.from(config.rpc_user + ":" + config.rpc_pass).toString("base64")
    }
}

function createCanalNameWithParams(eventName, ...args) {
    let s = eventName;
    for (let i = 0; i < args.length; i++) {
        s += ":";
        s += args[i];
    }
    return s;
}

function processBlockNotifyEvent(message) {
    io.in(eventNames.canals.subscribeBlockHashRoom).emit(eventNames.subscriptions.subscribeBlockHash, message);

    // gen info about block from phored
    request.post(config.phored_host + ':' + config.phored_rpc_port, {
            headers: createBasicAuthHeader(),
            json: createJsonData(eventNames.rpc.getblock, message)
        },
        (err, res, body) => {
            if (err) {
                return console.log(err);
            }
            else if (res && res.statusCode !== 200) {
                return console.log("Failed download", eventNames.rpc.getblock, "with params:", message || "empty",
                    "because", body.error.message)
            }

            console.log("Success download", eventNames.rpc.getblock, "with params:", message || "empty");
            io.in(eventNames.canals.subscribeBlockRoom).emit(eventNames.subscriptions.subscribeBlock, body.result);
        });
}

// new block appeared
redisIO.subClient.on('message', (channel, message) => {
    // write to all subscribed clients
    console.log(channel, message);
    if (channel === eventNames.redis.blocknotify) {
        // send new block to all subscribed clients
        processBlockNotifyEvent(message);
    }
});

// new socket client connection
io.on('connect', (socket) => {
    console.log("Client", socket.id, "connected");
    socket.on(eventNames.subscriptions.subscribeBlockHash, (fn) => {
        console.log("Client", socket.id, "subscribe to new blocks hash notification");
        socket.join(eventNames.canals.subscribeBlockHashRoom);
        fn("Success!");
    });

    socket.on(eventNames.subscriptions.subscribeBlock, (fn) => {
        console.log("Client", socket.id, "subscribe to new blocks notification");
        socket.join(eventNames.canals.subscribeBlockRoom);
        fn("Success!");
    });

    socket.on(eventNames.subscriptions.subscribeAddress, (...args) => {
        console.log("Client", socket.id, "subscribe to new address notification");

        // callback which is always last parameter
        let callback = args[args.length - 1];
        let address = null;
        let includeMempool = null;

        if (args.length === 2) {
            let arr = args[0];
            if (!Array.isArray(arr)) {
                return callback("Too few parameters or first parameter must be an array");
            }

            if (arr.length !== 2) {
                return callback("Array size must be exactly 2, but is " + arr.length);
            }

            address = arr[0];
            includeMempool = arr[1];
        }
        else if (args.length === 3) {
            address = args[0];
            includeMempool = args[1];
        }
        else {
            return callback("Function have incorrect number of parameters: " + args.length - 1);
        }

        if (!(includeMempool in Object.values(eventNames.includeTransactionType))) {
            callback("includeMempool has unsupported value: " + includeMempool +
                     ", correct values are: " + eventNames.includeTransactionType.keys());
        }

        if (typeof address !== "string") {
            return callback("Address must be a string");
        }

        socket.join(createCanalNameWithParams(eventNames.canals.subscribeAddressRoom, address, includeMempool));

        return callback("Success!");
    });

    socket.on(eventNames.subscriptions.unsubscribeAll, () => {
        for (let subscriptionName in Object.keys(eventNames.subscriptions)) {
            if (eventNames.subscriptions.hasOwnProperty(subscriptionName)) {
                socket.leave(subscriptionName);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log("Client", socket.id, "disconnected");
        //client disconnected
    });
});

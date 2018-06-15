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
let redisIO = socketioRedis({host: config.redis_host, port: config.redis_port,
    subClient: redis.createClient(config.redis_port, config.redis_host),
    pubClient: redis.createClient(config.redis_port, config.redis_host)});
redisIO.subClient.subscribe(eventNames.redis.blocknotify);
io.adapter(redisIO);


let createJsonData = function(method) {
    let args = [];
    for (let i = 1; i < arguments.length; i++) {
        console.log(arguments[i]);
        args.push(arguments[i]);
    }
    return {"jsonrpc": "2.0", "method": method, "params": args, "id": 1}
};

let createBasicAuthHeader = function() {
    return {
        Authorization: "Basic " + Buffer.from(config.rpc_user + ":" + config.rpc_pass).toString("base64")
    }
};

// new block appeared
redisIO.subClient.on('message', (channel, message) => {
    // write to all subscribed clients
    console.log(channel, message);
    if (channel === eventNames.redis.blocknotify) {
        // send new block to all subscribed clients
        io.in(eventNames.canals.subscribeBlockHashRoom).emit(eventNames.subscriptions.subscribeBlockHash, message);

        // gen info about block from phored
        request.post(config.phored_host + ':' + config.phored_port, {
                headers: createBasicAuthHeader(),
                json: createJsonData(eventNames.rpc.getblock, message)
            },
            (err, res, body) => {
                if (err || res.statusCode !== 200) {
                    return console.log(err);
                }

                io.in(eventNames.canals.subscribeBlockRoom).emit(eventNames.subscriptions.subscribeBlock, body.result);
        });
    }
});

// new socket client connection
io.on('connect', (socket) => {
    console.log("Client", socket.id, "connected");
    socket.on(eventNames.subscriptions.subscribeBlockHash, (fn) => {
        console.log("Client", socket.id , "subscribe to new blocks hash notification");
        socket.join(eventNames.canals.subscribeBlockHashRoom);
        fn("Success!");
    });

    socket.on(eventNames.subscriptions.subscribeBlock, (fn) => {
        console.log("Client", socket.id , "subscribe to new blocks notification");
        socket.join(eventNames.canals.subscribeBlockRoom);
        fn("Success!");
    });

    socket.on(eventNames.subscriptions.unsubscribeAll, () => {
        for (let subscriptionName in Object.keys(eventNames.subscriptions)) {
            if(eventNames.subscriptions.hasOwnProperty(subscriptionName)) {
                socket.leave(subscriptionName);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log("Client", socket.id, "disconnected");
        //client disconnected

    });
});
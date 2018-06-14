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
redisIO.subClient.subscribe(config.redis_blocknotify_key_name);
io.adapter(redisIO);

let createFormData = function(method) {
    return {"jsonrpc": "2.0", "method": method, "params": arguments, "id": 1}
};

// new block appeared
redisIO.subClient.on('message', (channel, message) => {
    // write to all subscribed clients
    console.log(channel, message);
    if (channel === config.redis_blocknotify_key_name) {
        io.in(eventNames.canals.subscribeBlockHashRoom).emit(eventNames.subscriptions.subscribeBlockHash , message);
        request.post(config.phored_host + ':' + config.phored_port, {
                json: true, formData: createFormData(eventNames.rpc.getblock, message)
            },
            (err, res, body) => {
            if (err) { return console.log(err); }
            console.log(body)
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
        for (let subscriptionName in eventNames.subscriptions) {
            socket.leave(subscriptionName);
        }
    });

    socket.on('disconnect', () => {
        console.log("Client", socket.id, "disconnected");
        //client disconnected

    });
});
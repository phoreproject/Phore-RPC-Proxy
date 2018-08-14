const express = require('express'),
    socketio = require('socket.io'),
    config = require('./config.js'),
    socketioRedis = require('socket.io-redis'),
    redis = require('redis'),
    eventNames = require('./eventNames.js'),
    subscribeClass = require('./subscriber');

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
redisIO.subClient.subscribe(eventNames.redis.mempoolnotify);
io.adapter(redisIO);

let subscriber = new subscribeClass.Subscriber();

// new block appeared
redisIO.subClient.on('message', async (channel, message) => {
    // write to all subscribed clients
    if (channel === eventNames.redis.blocknotify) {
        // send new block to all subscribed clients
        io.in(eventNames.canals.subscribeBlockHashRoom).emit(eventNames.subscriptions.subscribeBlockHash, message);
        const block = await subscriber.processBlockNotifyEvent(message);
        if (block !== undefined) {
            io.in(eventNames.canals.subscribeBlockRoom).emit(eventNames.subscriptions.subscribeBlock, block);
        }
    }
    else if (channel === eventNames.redis.mempoolnotify) {
        let message = await subscriber.processMemPoolEvent(message);
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
        const callback = args[args.length - 1];
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
            return callback("includeMempool has unsupported value: " + includeMempool +
                ", correct values are: " + eventNames.includeTransactionType.keys());
        }

        if (typeof address !== "string") {
            return callback("Address must be a string");
        }

        subscriber.subscribeAddress(socket, address, includeMempool);
        return callback("Success!");
    });

    socket.on(eventNames.subscriptions.subscribeBloom, (...args) => {
        console.log("Client", socket.id, "subscribe bloom filter");

        // callback which is always last parameter
        const callback = args[args.length - 1];
        let filterHex = null;
        let hashFunc = null;
        let tweak = null;
        let includeMempool = null;
        let flags = null;

        if (args.length === 5 || args.length === 6) {
            filterHex = args[1];
            hashFunc = args[2];
            tweak = args[3];
            includeMempool = args[4];

            if (args.length === 6) {
                flags = args[5];
            }
        }

        if (!(includeMempool in Object.values(eventNames.includeTransactionType))) {
            return callback("includeMempool has unsupported value: " + includeMempool +
                ", correct values are: " + eventNames.includeTransactionType.keys());
        }

        subscriber.subscribeBloom(socket, filterHex, hashFunc, tweak, includeMempool, flags);

        return callback("Success");
    });

    socket.on(eventNames.subscriptions.unsubscribeAll, () => {
        for (const subscriptionName in Object.keys(eventNames.subscriptions)) {
            if (eventNames.subscriptions.hasOwnProperty(subscriptionName)) {
                socket.leave(subscriptionName);
            }
        }
        subscriber.unsubscribeAll(socket);
    });

    socket.on('disconnect', () => {
        console.log("Client", socket.id, "disconnected");
        subscriber.unsubscribeAll(socket);
    });
});

const config = require('./config.js'),
    eventNames = require('./eventNames.js'),
    subscribeClass = require('./subscriber'),
    tools = require("./tools.js"),
    express = require('express'),
    socketio = require('socket.io'),
    redis = require('redis');

// config express app
let app = express();
let server = app.listen(config.web_port);
app.use(express.static('static'));
console.log("App listen on port " + config.web_port);
console.log("Download url: " + tools.createUri());

// config socket io
let io = socketio(server).of('/socket.io');

// config redis
let redisClient = redis.createClient(config.redis_port, config.redis_host);
redisClient.subscribe(eventNames.redis.blocknotify);
redisClient.subscribe(eventNames.redis.mempoolnotify);

// config subscriber
let subscriber = new subscribeClass.Subscriber();

// new block appeared
redisClient.on('message', async (channel, message) => {
    // write to all subscribed clients
    if (channel === eventNames.redis.blocknotify) {
        // send new block to all subscribed clients
        io.in(eventNames.canals.subscribeBlockHashRoom).emit(eventNames.subscriptions.subscribeBlockHash, message);
        const block = await subscriber.processBlockNotifyEvent(message);
        if (block != null) {
            io.in(eventNames.canals.subscribeBlockRoom).emit(eventNames.subscriptions.subscribeBlock, block);
        }
    }
    else if (channel === eventNames.redis.mempoolnotify) {
        subscriber.processMemPoolEvent(message);
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
                ", correct values are: " + Object.values(eventNames.includeTransactionType));
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
        let flags = eventNames.bloomUpdateType.None;

        if (args.length < 4 || args.length > 6) {
            return callback("Incorrect number of arguments");
        }

        let filterHex = tools.hexToBytes(args[0]);
        let hashFunc = args[1];
        let tweak = args[2];
        let includeMempool = args[3];

        if (args.length === 6) {
            flags = args[5];
        }

        if (!(flags in Object.values(eventNames.bloomUpdateType))) {
            return callback("includeMempool has unsupported value: " + includeMempool +
                ", correct values are: " + Object.values(eventNames.bloomUpdateType));
        }

        if (!(includeMempool in Object.values(eventNames.includeTransactionType))) {
            return callback("includeMempool has unsupported value: " + includeMempool +
                ", correct values are: " +  Object.values(eventNames.includeTransactionType));
        }

        subscriber.subscribeBloom(socket, filterHex, hashFunc, tweak, includeMempool, flags);

        return callback("Success!");
    });

    socket.on(eventNames.subscriptions.unsubscribeAll, () => {
        for (const subscriptionName in Object.keys(eventNames.subscriptions)) {
            if (eventNames.subscriptions.hasOwnProperty(subscriptionName)) {
                socket.leave(subscriptionName);
            }
        }
        subscriber.unsubscribeAll(socket);
    });

    socket.on('error', (err) => {
        console.log(err);
    });

    socket.on('disconnect', () => {
        console.log("Client", socket.id, "disconnected");
        subscriber.unsubscribeAll(socket);
    });
});

const express = require('express'),
    socketio = require('socket.io'),
    config = require('./config.js'),
    socketioRedis = require('socket.io-redis'),
    redis = require('redis');

let app = express();
let server = app.listen(config.web_port);
let io = socketio(server);

app.use(express.static('static'));
let redisInstance = socketioRedis({host: config.redis_host, port: config.redis_port,
    subClient: redis.createClient(config.redis_port, config.redis_host),
    pubClient: redis.createClient(config.redis_port, config.redis_host)});
redisInstance.subClient.subscribe(config.redis_blocknotify_key_name);
io.adapter(redisInstance);

redisInstance.subClient.on('message', (channel, message) => {
    console.log(channel, message)
});

io.on('connection', (socket) => {
    // client connected

    socket.on('data', (message) => {
        // client send command
    });

    socket.on('close', () => {
        //client disconnected
    });
});
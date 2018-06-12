const express = require('express'),
    socketio = require('socket.io'),
    config = require('./config.js'),
    socketioRedis = require('socket.io-redis'),
    redis = require('redis');

let app = express();
let server = app.listen(config.web_port);
let io = socketio(server);
let redisSubscriber = redis.createClient(config.redis_port, config.redis_host);

app.use(express.static('static'));
io.adapter(socketioRedis({host: config.redis_host, port: config.redis_port}));


redisSubscriber.on('message', (channel, message) => {
   console.log('notification type:', config.redis_blocknotify_key_name + ', message:', message);
});
redisSubscriber.subscribe(config.redis_blocknotify_key_name);

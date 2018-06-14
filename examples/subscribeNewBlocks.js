//client.js
let io = require('socket.io-client');
let config = require('../config.js');
let socket = io('http://localhost:' + config.web_port, {reconnect: true});

// Add a connect listener
socket.on('connect', function (connection) {
    console.log('Connected!');

    socket.emit('subscribeBlock', (response) => {
        console.log(response);
    });
});

socket.on("subscribeBlock", (message) => {
    console.log("new block discovered", message);
});

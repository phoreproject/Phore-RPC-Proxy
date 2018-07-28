//client.js
let io = require('socket.io-client');
let config = require('../config.js');
let eventNames = require('../eventNames.js');
let socket = io(config.web_host + ':' + config.web_port, {reconnect: true});

// Add a connect listener
socket.on('connect', function (connection) {
    console.log('Connected!');

    socket.emit(eventNames.subscriptions.subscribeBlockHash, (response) => {
        console.log(response);
    });

    socket.emit(eventNames.subscriptions.subscribeBlock, (response) => {
        console.log(response);
    });

    socket.emit(eventNames.subscriptions.subscribeAddress, "address", "0", (response) => {
        console.log(response);
    });
});

socket.on(eventNames.subscriptions.subscribeBlockHash, (message) => {
    console.log("new block hash discovered", message);
});

socket.on(eventNames.subscriptions.subscribeBlock, (message) => {
    console.log("new block discovered", message);
});

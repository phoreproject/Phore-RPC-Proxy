let config = require('../config.js');
let eventNames = require('../eventNames.js');
let gb = require('./generateBloom');
let io = require('socket.io-client');

let socket = io(config.web_host + ':' + config.web_host, {reconnect: true});


if (process.argv.length <= 2) { // 1 is node, 2 is this file
    throw TypeError("You need to provide PHR address(es)");
}
const addresses = process.argv.slice(2);

// Add a connect listener
socket.on('connect', function () {
    console.log('Connected!');

    socket.emit(eventNames.subscriptions.subscribeBlockHash, (response) => {
        console.log(response);
    });

    socket.emit(eventNames.subscriptions.subscribeBlock, (response) => {
        console.log(response);
    });

    socket.emit(eventNames.subscriptions.subscribeAddress, addresses[0], eventNames.includeTransactionType.include_all, (response) => {
        console.log(response);
    });

    socket.emit(eventNames.subscriptions.subscribeBloom, ...gb.generateBloom(addresses), (response) => {
        console.log(response);
    });
});

socket.on(eventNames.subscriptions.subscribeBlockHash, (message) => {
    console.log("new block hash discovered", message);
});

socket.on(eventNames.subscriptions.subscribeBlock, (message) => {
    console.log("new block discovered", message);
});

socket.on(eventNames.subscriptions.subscribeAddress, (message) => {
    console.log("address discovered", message);
});

socket.on(eventNames.subscriptions.subscribeBloom, (message) => {
    console.log("bloom address discovered", message);
});
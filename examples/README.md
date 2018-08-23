#Examples

RPC proxy is distributed with a few examples of the most common end user usages.

## Prerequisites 
There are not many prerequisites required to run examples, but you'll need the following:
- Node.js
- Node Package Manager
- Node packages, install it with `npm install`
- Other (example dependent)

## generateBloom.js
This sample shows usage of bloom filters and how filter should be correctly created.
Example can be started with: `node generateBlom.js`

## sendRpcRequests.js
This example needs more attention. Additional requirements is working RPC instance. 
For make everything work you need to set up env variables. There are a few solutions:
- use official Phore one: 
    * PHORED_HOST="https://rpc.phore.io/rpc"
    * PHORED_RPC_PATH="/rpc"
    * PHORED_RPC_PORT=443

- use own local instance / docker instance.

**Note**: in some cases it could be necessary to set up also RPC_USER and RPC_PASS

## subscribe.js
This sample needs Socket.io server to be running. 
For make this work you need to set up env variables.
- WEB_HOST - ws server host e.g 'http://127.0.0.1' 
- WEB_PORT - ws server path e.g 80 for http

You can run it with:

`node subscribe.js address [address]`

First address is subscribed by 'subscribeAddress', and all addresses are subscribed by bloom filter.
This script use **generateBloom.js** to generate bloom filter.

For debug purposes you can send to 'blocknotify' Redis canal information about new block and it will propagate by the 
Redis through web socket server to your **subscribe.js** instance. Block hash must be valid and exist in Phore 
blockchain.

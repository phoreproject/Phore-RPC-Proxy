# Phore-RPC-Proxy
New generation proxy using JSON-RPC calls to access the Phore blockchain. It offers also Socket.io access to subscribe functions like:
  * subscribeBlock
  * subscribeAddress
  * subscribeBloom

## Getting started
These instructions will get you a copy of the project up and running for developing or testing purposes.

## Prerequisites
Depends on environment. This guide covers 2 ways to deploy project.
1. **Locally using Docker** (free) - basically you need only Docker which is free software available from docker.com website.
2. **AWS cloud** (generally not free) - in this set up you need AWS account. You don't need any AWS knowledge to set up
project using CloudFormation.

You can also install it locally without docker, but it is platform dependent solution. For e.g Windows doesn't have
official Redis build which is necessary for entire system to work. There are no problems with deployment locally on Unix
and macOs systems. For local deployment you need to install Node.js.

## How to set up locally
The easiest and multiplatform choise is to use Docker containers.
1. Setup env variables used in this guide.   
    Strong login credentials are necessary to make connection secure.   
    **Everyone who know your login and password can steal money from wallet with RPC turned on.**  
    **RPC_USER**=_your_unique_rpc_name_  
    **RPC_PASS**=_your_strong_password_  
    
    You can set other value as follows:  
    **REDIS_PORT**=6379  
    **PHORED_WEB_PORT**=8000  
    **WEB_PORT**=8001  
    **PHORED_PORT**=22771 -> default is 11771, changed for avoid problems with local wallet instance  
    **PHORED_RPC_PORT**=22772 -> default is 11772, changed for avoid problems with local wallet instance  
    
2. First of all we need redis container:
    * `docker pull redis`
    * `docker run -p $(echo $REDIS_PORT):6379 --name redis_instance -td redis`
    
    Lets look for Redis host in docker network by using   
    `docker network inspect bridge`   
    and find appropriate container ip in 'Containers' section.
    Then set up **REDIS_HOST**. 

3. Start phored instance.
    * `cd scripts/phored`
    * `docker build --build-arg RPC_USER=$(echo RPC_USER) --build-arg RPC_PASS=$(echo RPC_PASS) -t phored`
    
    AND then  
    * `docker run -p $(echo $PHORED_PORT):11771 -p $(echo $PHORED_RPC_PORT):11772 -p $(echo $PHORED_WEB_PORT):80 
    -e REDIS_PORT=$(echo $REDIS_PORT) -e REDIS_HOST=$(echo $REDIS_HOST) -e START_FROM_BEGINNING=1 -td phored`
    
    OR run and attach to container to see what is going on
    * `docker run -p $(echo $PHORED_PORT):11771 -p $(echo $PHORED_RPC_PORT):11772 -p $(echo $PHORED_WEB_PORT):80 
    -e REDIS_PORT=$(echo $REDIS_PORT) -e REDIS_HOST=$(echo $REDIS_HOST) -it phored npm start`
    * `supervisord -c supervisord.conf`
    
    Now you need to set env variable for PHORED_HOST (same method as with Redis). Phored host must be specified with
    protocol (for e.g http://127.0.0.1)
    
    #### NOTE:
    - Set up START_FROM_BEGINNING to skip downloading wallet data from AWS bucket. This is not available without AWS api keys.
    
    - **WEB_PORT** is optional, but recommended one - it can be use to send indirect rpc command wihout basic authentication, 
    but it supports only safe rpc commands.
    
    - **It will take some time to download all blocks for phored. It could take even a few hours.**
    
4. Start webservice instance
    * go to home directory
    * `docker build --build-arg RPC_USER=$(echo RPC_USER) --build-arg RPC_PASS=$(echo RPC_PASS) -t rpc_web_service`
    * `docker run -p $(echo $WEB_PORT):80 -e REDIS_PORT=$(echo $REDIS_PORT) -e REDIS_HOST=$(echo $REDIS_HOST)
     -e PHORED_PORT=$(echo $PHORED_PORT) -e PHORED_RPC_PORT=$(echo $PHORED_RPC_PORT) 
     -e $PHORED_WEB_PORT=(echo $PHORED_WEB_PORT) -dt rpc_web_service`

5. Now you can use RPC and websocket server:
    * RPC is available under http://localhost:$PHORED_WEB_PORT/rpc
    * WS is available under http://localhost:$WEB_PORT/ws
    
    
## How to set up on AWS
[AWS setup guidlines](aws_cloud_formation/README.md)


## Examples
[Local examples](examples/README.md)
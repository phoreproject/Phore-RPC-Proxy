const config = require('../config.js');
const { execFile } = require('child_process');
const util = require('util');
const fs = require('fs');
const ncp = require('ncp').ncp;
const path = require('path');

const DIRECTORIES_TO_COPY = ['blocks', 'chainstate', 'sporks', 'zerocoin'];
const CREATE_SNAPSHOT_EVERY_MS = 1000 * 60;

function createPhoredInstance() {
    return execFile(config.phored_exec, (error, stdout, stderr) => {
        if (error) {
            throw error;
        }
        console.log(stdout);
    });
}

function closePhoredByCLI() {
    return new Promise((resolve, reject) => {
        setTimeout(execFile, CREATE_SNAPSHOT_EVERY_MS, config.phore_cli, ['stop'], (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });
    });
}

function isPhoredStopped(phoredInstance) {
    return new Promise((resolve, reject) => {
        phoredInstance.on('close', (code)=>{
            if(code != 0) {
                console.log("Phored stopping error", code);
                reject(code);
            }
            console.log("Phored stopped");
            resolve();
        });
    })
}

function copyData() {
    return new Promise((resolve, reject) => {
        let copiedDirsCnt = 0;
        if(!path.existsSync(config.phored_data_dir)) {
            reject("Wrong data dir path");
        }
        for (let dir in DIRECTORIES_TO_COPY) {
            ncp(config.phored_data_dir + dir, config.backup_data_dir + dir, (err) => {
                if (err) {
                    reject(err);
                }
                ++copiedDirsCnt;
                if (copiedDirsCnt === DIRECTORIES_TO_COPY.length) {
                    resolve();
                }
            })
        }
    });
}

async function main() {
    try {
        while (true) {
            let phoredInstance = createPhoredInstance();
            await closePhoredByCLI();
            await isPhoredStopped(phoredInstance);
            await copyData();
        }
    }
    catch (e) {
        console.log(e);
        process.exit(-1);
    }
}

main();


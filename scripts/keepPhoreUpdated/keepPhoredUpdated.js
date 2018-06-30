const config = require('./config.js');
const {execFile, spawn} = require('child_process');
const util = require('util');
const fs = require('fs');
const fstream = require('fstream');
const path = require('path');
const async = require('async');
const AWS = require('aws-sdk');
const tar = require('tar-fs');
const zlib = require('zlib');


const DIRECTORIES_TO_COPY = ['blocks', 'chainstate', 'sporks', 'zerocoin'];
const CREATE_SNAPSHOT_EVERY_MS = 1000 * 60 * 60; // 1 hour
const KEEP_MAX_BACKUPS = 12;                     // 12 backups

function createPhoredInstance() {
    console.log("Starting phored");
    return spawn(config.phored_exec,
        ['-printtoconsole', '-rpcuser=' + config.rpc_user, '-rpcpassword=' + config.rpc_pass],
        {stdio: 'inherit'},
        (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
        });
}

function closePhoredByCLI() {
    return new Promise((resolve, reject) => {
        setTimeout(execFile, CREATE_SNAPSHOT_EVERY_MS, config.phore_cli,
            ['-rpcuser=' + config.rpc_user, '-rpcpassword=' + config.rpc_pass, 'stop'],
            (error, stdout, stderr) => {
                console.log("Stoping phored");
                if (error) {
                    reject(error);
                }
                resolve();
            });
    });
}

function isPhoredStopped(phoredInstance) {
    return new Promise((resolve, reject) => {
        phoredInstance.on('close', (code) => {
            if (code !== 0) {
                console.log("Phored stopping error", code);
                reject(code);
            }
            console.log("Phored stopped");
            resolve();
        });
    })
}

function getFormattedTime() {
    let dateObj = new Date();
    let year = dateObj.getFullYear();
    let month = dateObj.getMonth() + 1;
    let day = dateObj.getDate();
    let hour = dateObj.getHours();
    let minute = dateObj.getMinutes();
    let second = dateObj.getSeconds();
    return year + "-" + month + "-" + day + "-" + hour + "-" + minute + "-" + second;
}

function createS3Instance() {
    s3 = new AWS.S3();
    AWS.config.update({region: config.backup_S3_region});

    return s3;
}

async function copyData(s3) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(config.phored_data_dir)) {
            reject("Wrong data dir path " + config.phored_data_dir);
        }

        const s3FilePrefix = getFormattedTime();
        async.every(DIRECTORIES_TO_COPY, (directory, callback) => {
            const dirPath = path.join(config.phored_data_dir, directory);
            const body = tar.pack(dirPath).pipe(zlib.Gzip());
            const params = {Bucket: config.backup_S3_dir, Key: dirPath, Body: body};
            const options = {partSize: 10 * 1024 * 1024, queueSize: 1};
            s3.upload(params, options, function(err, data) {
                if (err) {
                    callback(err, false);
                }
                callback(null, true);
            });

        }, (err, result) => {
            if (result) {
                resolve();
            }
            else {
                reject(err);
            }
        });

        setTimeout(() => {
            reject("Copying data timeout");
        }, CREATE_SNAPSHOT_EVERY_MS)
    });
}

async function main() {
    try {
        console.log("Started");
        const s3 = createS3Instance();
        while (true) {
            let phoredInstance = createPhoredInstance();
            await closePhoredByCLI();
            await isPhoredStopped(phoredInstance);
            await copyData(s3);
        }
    }
    catch (e) {
        console.log(e);
        process.exit(-1);
    }
}

main();


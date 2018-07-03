const config = require('./config.js'),
    {execFile, spawn} = require('child_process'),
    util = require('util'),
    fs = require('fs'),
    fstream = require('fstream'),
    path = require('path'),
    async = require('async'),
    AWS = require('aws-sdk'),
    tar = require('tar-fs'),
    zlib = require('zlib');


const DIRECTORIES_TO_COPY = ['blocks', 'chainstate', 'sporks', 'zerocoin'];
const CREATE_SNAPSHOT_EVERY_MS = 1000 * 60 * 60 * 6; // 6 hours

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

async function isS3InstanceAvailable(s3) {
    return new Promise((resolve, reject) => {
        s3.getObject({Bucket: config.backup_S3_dir, Key: config.backup_config_S3_file}, (err, data) => {
            if (err && err.code !== "NoSuchKey") {
                reject(err);
            }
            resolve();
        })
    })
}

async function createS3Adapter() {
    s3 = new AWS.S3();
    AWS.config.update({region: config.backup_S3_region});
    await isS3InstanceAvailable(s3);
    return s3;
}

async function copyData(s3) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(config.phored_data_dir)) {
            reject("Wrong data dir path " + config.phored_data_dir);
        }

        const s3FilePrefix = getFormattedTime();
        async.every(DIRECTORIES_TO_COPY, (directory, callback) => {
            const body = tar.pack(path.join(config.phored_data_dir, directory)).pipe(zlib.Gzip());
            const bucketDirPath = s3FilePrefix + "/" + directory;
            const params = {Bucket: config.backup_S3_dir, Key: bucketDirPath, Body: body};
            const options = {partSize: 10 * 1024 * 1024, queueSize: 1};
            console.log("Uploading dir", directory, "to", bucketDirPath);
            s3.upload(params, options, (err, data) => {
                if (err) {
                    callback(err, false);
                }
                console.log("Dir", bucketDirPath ,"uploaded successfully");
                callback(null, true);
            });

        }, (err, result) => {
            if (result) {
                s3.putObject({
                    Bucket: config.backup_S3_dir,
                    Key: config.backup_config_S3_file,
                    Body: s3FilePrefix
                }, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    console.log("Successfully updated", config.backup_config_S3_file, "file");
                    resolve();
                })
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
        const s3 = await createS3Adapter();
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


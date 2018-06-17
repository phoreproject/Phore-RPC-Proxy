const config = require('./config.js');
const {execFile, spawn} = require('child_process');
const util = require('util');
const fs = require('fs');
const ncp = require('ncp').ncp;
const path = require('path');
const async = require('async');

const DIRECTORIES_TO_COPY = ['blocks', 'chainstate', 'sporks', 'zerocoin'];
const CREATE_SNAPSHOT_EVERY_MS = 1000 * 60 * 60; // 1 hour
const KEEP_MAX_BACKUPS = 12;                     // 12 backups

function createPhoredInstance() {
    console.log("Starting phored");
    return spawn(config.phored_exec, ['-printtoconsole'], {stdio: 'inherit'}, (error, stdout, stderr) => {
        if (error) {
            throw error;
        }
    });
}

function closePhoredByCLI() {
    return new Promise((resolve, reject) => {
        setTimeout(execFile, CREATE_SNAPSHOT_EVERY_MS, config.phore_cli, ['stop'], (error, stdout, stderr) => {
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

function walkDirSync(dir) {
    const files = fs.readdirSync(dir);
    let dirList = [];
    files.forEach((file) => {
        let stats = fs.statSync(path.join(dir, file));
        if (stats.isDirectory()) {
            dirList.push({path: path.join(dir, file), stats: stats});
        }
    });
    return dirList;
}

function copyDir(srcDir, dstDir, callback) {
    ncp(srcDir, dstDir, (err) => {
        console.log("Backup", dstDir, "created successfully");
        callback(null, !err);
    })
}

function deleteFolderRecursive(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file, index) => {
            let curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
    }
}

async function copyData() {
    return new Promise((resolve, reject) => {
        let copiedDirsCnt = 0;
        if (!fs.existsSync(config.phored_data_dir)) {
            reject("Wrong data dir path");
        }

        if (!fs.existsSync(config.backup_data_dir)) {
            fs.mkdirSync(config.backup_data_dir);
        }

        const dirList = walkDirSync(config.backup_data_dir);
        dirList.sort((a,b) =>{
            const a_birth = a.stats.birthtimeMs;
            const b_birth = b.stats.birthtimeMs;

            return a_birth < b_birth ? -1 : (a_birth > b_birth ? 1 : 0);
        });

        if (dirList.length > KEEP_MAX_BACKUPS) {
            for (let i = 0; i < dirList.length - KEEP_MAX_BACKUPS; i++){
                deleteFolderRecursive(dirList[i].path);
            }
        }

        const dataStr = getFormattedTime();
        fs.mkdirSync(path.join(config.backup_data_dir, dataStr));
        console.log("Creating new backup in dir", path.join(config.backup_data_dir, dataStr));
        async.every(DIRECTORIES_TO_COPY, (directory, callback) => {
            copyDir(path.join(config.phored_data_dir, directory),
                path.join(config.backup_data_dir, dataStr, directory),
                callback);
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


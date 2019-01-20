const config = require('./config.js'),
    {execFile, spawn, exec} = require('child_process'),
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    AWS = require('aws-sdk'),
    tar = require('tar-fs'),
    zlib = require('zlib'),
    express = require('express');


const DIRECTORIES_TO_COPY = ['blocks', 'chainstate', 'sporks', 'zerocoin'];
const CREATE_SNAPSHOT_EVERY_MS = 1000 * 60 * config.create_backup_every; //convert from minutes to ms
const KEEP_BACKUPS_FOR_MS = 1000 * 60 * config.keep_backup_for;

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
    let s3 = new AWS.S3();
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
            const params = {
                Bucket: config.backup_S3_dir,
                Key: bucketDirPath,
                Body: body,
                Tagging: "short_term=True",
            };
            const options = {partSize: 10 * 1024 * 1024, queueSize: 1};
            console.log("Uploading dir", directory, "to", bucketDirPath);
            s3.upload(params, options, (err, data) => {
                if (err) {
                    callback(err, false);
                }
                console.log("Dir", bucketDirPath, "uploaded successfully");
                callback(null, true);
            });

        }, (err, result) => {
            if (result) {
                s3.putObject({
                    Bucket: config.backup_S3_dir,
                    Key: config.backup_config_S3_file,
                    Body: s3FilePrefix,
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

async function execPromise(command) {
    return new Promise(function(resolve, reject) {
        exec(command, {stdio: 'inherit'}, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            resolve({stdout: stdout.trim(), stderr: stderr.trim()});
        });
    });
}

async function updatePhoredToTheNewestVersion() {
    if (!fs.existsSync(config.binary_url_file)) {
        console.log("No file", config.binary_url_file, "exists");
        return false;
    }

    try {
        const currentUrl = fs.readFileSync(config.binary_url_file, 'utf8').trim();
        // download newest version of available phored
        const command = 'curl -s https://api.github.com/repos/phoreproject/Phore/releases/latest \\\n' +
            '      | grep browser_download_url \\\n' +
            '      | grep x86_64-linux-gnu \\\n' +
            '      | cut -d \'"\' -f 4';

        let newUrl = await execPromise(command);
        newUrl = newUrl.stdout.trim();
        if (currentUrl === newUrl) {
            console.log("No newer version of phored available. The newest is", newUrl);
            return false;
        }

        const downloadCommand = 'wget -O phore.tar.gz ' + newUrl;
        await execPromise(downloadCommand);

        const tarCommand = 'tar -xzf phore.tar.gz -C phored --strip-components=1';
        await execPromise(tarCommand);

        fs.writeFileSync(config.binary_url_file, newUrl);
    }
    catch (e) {
        console.log("Cannot update no new version of phored");
        console.log(e);
        return false;
    }

    return true;
}

async function main() {
    try {
        let app = express();
        app.get('*', (req, res) => res.send('Health check'));
        app.listen(80);

        console.log("Started");
        console.log("Backups are automatically cleared after", config.keep_backup_for, "minutes");
        console.log("Backups are created every", config.create_backup_every, "minutes");
        const s3 = await createS3Adapter();
        while (true) {
            let phoredInstance = createPhoredInstance();
            await closePhoredByCLI();
            await isPhoredStopped(phoredInstance);
            await copyData(s3);
            await updatePhoredToTheNewestVersion();
        }
    }
    catch (e) {
        console.log(e);
        process.exit(-1);
    }
}

main();


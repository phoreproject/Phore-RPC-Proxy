const config = require('./config.js'),
    AWS = require('aws-sdk'),
    tar = require('tar-fs'),
    zlib = require('zlib'),
    fs = require('fs'),
    async = require('async'),
    path = require('path');

function main() {
    if (config.start_from_beginning) {
        process.exit(0);
    }

    s3 = new AWS.S3();
    AWS.config.update({region: config.backup_S3_region});

    if (!fs.existsSync(config.phored_data_dir)) {
        console.log(config.phored_data_dir, "doesn't exists");
        fs.mkdirSync(config.phored_data_dir);
        console.log(config.phored_data_dir, "created");
    }

    s3.getObject({Bucket: config.backup_S3_dir, Key: config.backup_config_S3_file}, (err, s3Prefix) => {
        if (err) {
            if (err.code !== "NoSuchKey") {
                throw err;
            }
            console.log("\nNot backup data available, downloading all blocks from beginning!\n");
            process.exit(0);
        }

        s3.listObjectsV2({Bucket: config.backup_S3_dir, Prefix: s3Prefix.Body.toString()}, (err, objectListInfo) => {
            if (err) {
                throw err;
            }

            async.every(objectListInfo.Contents,
                (objectInfo, callback) => {

                    let readStream = s3.getObject({
                        Bucket: config.backup_S3_dir,
                        Key: objectInfo.Key
                    }).createReadStream();

                    const dirName = objectInfo.Key.split("/")[1];
                    const dirPath = path.join(config.phored_data_dir, dirName);

                    const gunzip = zlib.createGunzip();
                    gunzip.on('error', (err) => {
                        callback(err, false);
                    });

                    const untarStream = tar.extract(dirPath);
                    untarStream.on('error', (err) => {
                        callback(err, false);
                    });

                    untarStream.on('finish', () => {
                        console.log('Directory', dirName, 'successfully downloaded');
                        callback(null, true);
                    });

                    readStream.pipe(gunzip).pipe(untarStream);

                }, (err, result) => {
                    if (!result) {
                        console.log("Cannot download necessary files");
                        throw err;
                    }
                })
        })
    })
}

main();
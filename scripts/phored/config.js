module.exports = {
    redis_host: process.env.REDIS_HOST != null ? process.env.REDIS_HOST : '127.0.0.1',
    redis_port: process.env.REDIS_PORT != null ? process.env.REDIS_PORT : 6379,
    backup_S3_dir: process.env.PHORED_BACKUP_S3_DIR != null ? process.env.PHORED_BACKUP_S3_DIR : 'phored-db-backup',
    backup_S3_region: process.env.PHORED_BACKUP_S3_REGION != null ? process.env.PHORED_BACKUP_S3_REGION : 'us-east-1',
    backup_config_S3_file: process.env.PHORED_BACKUP_S3_INFO != null ? process.env.PHORED_BACKUP_S3_INFO != null : 'newest_prefix',
    phored_data_dir: process.env.PHORED_DATA_DIR != null ? process.env.PHORED_DATA_DIR : '/root/.phore',
    start_from_beginning: process.env.START_FROM_BEGINNING != null ? process.env.START_FROM_BEGINNING : false,
};

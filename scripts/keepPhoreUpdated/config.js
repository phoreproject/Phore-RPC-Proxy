module.exports = {
    phored_exec: process.env.PHORED_EXEC != null ? process.env.PHORED_EXEC : './phored',
    phore_cli: process.env.PHORE_CLI != null ? process.env.PHORE_CLI : './phore-cli',
    backup_S3_dir: process.env.PHORED_BACKUP_S3_DIR != null ? process.env.PHORED_BACKUP_S3_DIR : 'phored-db-backup',
    backup_S3_region: process.env.PHORED_BACKUP_S3_REGION != null ? process.env.PHORED_BACKUP_S3_REGION : 'us-east-1',
    backup_config_S3_file: process.env.PHORED_BACKUP_S3_INFO != null ? process.env.PHORED_BACKUP_S3_INFO != null : 'newest_prefix',
    phored_data_dir: process.env.PHORED_DATA_DIR != null ? process.env.PHORED_DATA_DIR : '../_data',
    rpc_user: process.env.RPC_USER != null ? process.env.RPC_USER : 'phorerpc',
    rpc_pass: process.env.RPC_PASS != null ? process.env.RPC_PASS : 'CLQAWNfstzFzq3xm1qpG4aX75U2CoVpZqBkkz4QvzY7b',
};

module.exports = {
    phored_exec: process.env.PHORED_EXEC != null ? process.env.PHORED_EXEC : './phored',
    phore_cli: process.env.PHORE_CLI != null ? process.env.PHORE_CLI : './phore-cli',
    backup_S3_dir: process.env.PHORED_BACKUP_S3_DIR != null ? process.env.PHORED_BACKUP_S3_DIR : 'phored-db-backup',
    backup_S3_region: process.env.AWS_DEFAULT_REGION != null ? process.env.AWS_DEFAULT_REGION : 'us-east-1',
    backup_config_S3_file: process.env.PHORED_BACKUP_S3_INFO != null ? process.env.PHORED_BACKUP_S3_INFO : 'newest_prefix',
    phored_data_dir: process.env.PHORED_DATA_DIR != null ? process.env.PHORED_DATA_DIR : '/root/.phore',
    start_from_beginning: process.env.START_FROM_BEGINNING != null ? process.env.START_FROM_BEGINNING : false,

    // in minutes
    keep_backup_for: process.env.KEEP_BACKUP_FOR != null ? process.env.KEEP_BACKUP_FOR : 60 * 48, // 48h
    create_backup_every: process.env.CREATE_SNAPSHOT_EVERY != null ? process.env.CREATE_SNAPSHOT_EVERY : 60 * 3, // 6h

    //RPC user and pass for container local instance of phored. This phored instance should never be available
    //from the public or even other containers. Obligatory parameters.
    rpc_user: process.env.RPC_USER,
    rpc_pass: process.env.RPC_PASS,
};

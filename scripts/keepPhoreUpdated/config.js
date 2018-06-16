module.exports = {
    phored_exec: process.env.PHORED_EXEC != null ? process.env.PHORED_EXEC : './phored',
    phore_cli: process.env.PHORE_CLI != null ? process.env.PHORE_CLI : './phore-cli',
    backup_data_dir: process.env.PHORED_BACKUP_DIR != null ? process.env.PHORED_BACKUP_DIR : './backup',
    phored_data_dir: process.env.PHORED_DATA_DIR != null ? process.env.PHORED_DATA_DIR : '../_data',
};

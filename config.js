module.exports = {
    redis_host: process.env.REDIS_HOST != null ? process.env.REDIS_HOST : '127.0.0.1',
    redis_port: process.env.REDIS_PORT != null ? process.env.REDIS_PORT : 6379,
    web_host: process.env.WEB_HOST != null ? process.env.WEB_HOST : 'http://127.0.0.1',
    web_port: process.env.WEB_PORT != null ? process.env.WEB_PORT : 8080,
    phored_host: process.env.PHORED_HOST != null ? process.env.PHORED_HOST : 'http://127.0.0.1',
    phored_port: process.env.PHORED_PORT != null ? process.env.PHORED_PORT : 11772,
    phored_exec: process.env.PHORED_EXEC != null ? process.env.PHORED_EXEC : './phored',
    phore_cli: process.env.PHORE_CLI != null ? process.env.PHORE_CLI : './phore-cli',
    rpc_user: process.env.RPC_USER != null ? process.env.RPC_USER : 'phorerpc',
    rpc_pass: process.env.RPC_PASS != null ? process.env.RPC_PASS : 'CLQAWNfstzFzq3xm1qpG4aX75U2CoVpZqBkkz4QvzY7b',
    backup_data_dir: process.env.PHORED_BACKUP_DIR != null ? process.env.PHORED_BACKUP_DIR : './backup',
    phored_data_dir: process.env.PHORED_DATA_DIR != null ? process.env.PHORED_DATA_DIR : '../_data',
};

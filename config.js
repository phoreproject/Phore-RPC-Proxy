module.exports = {
    redis_host: process.env.REDIS_HOST !== null ? process.env.REDIS_HOST : '127.0.0.1',
    redis_port: process.env.REDIS_PORT !== null ? process.env.REDIS_PORT : 6379,
    web_port: process.env.WEB_PORT !== null ? process.env.WEB_PORT : 8080,
    redis_blocknotify_key_name: 'blocknotify',
    redis_mempoolnotify_key_name: 'mempoolnotify'
};

module.exports = {
    redis_host: process.env.REDIS_HOST != null ? process.env.REDIS_HOST: '127.0.0.1',
    redis_port: process.env.REDIS_PORT != null ? process.env.REDIS_PORT: 6379,
    web_host: process.env.WEB_HOST != null ? process.env.WEB_HOST: '127.0.0.1',
    web_port: process.env.WEB_PORT != null ? process.env.WEB_PORT: 8080,
    phored_host: process.env.PHORED_HOST != null ? process.env.PHORED_HOST: '127.0.0.1',
    phored_port: process.env.PHORED_PORT != null ? process.env.PHORED_PORT: 80,
    redis_blocknotify_key_name: 'blocknotify',
    redis_mempoolnotify_key_name: 'mempoolnotify',
};

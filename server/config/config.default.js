/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    /**
     * built-in config
     * @type {Egg.EggAppConfig}
     **/
    const config = exports = {};

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1602663286424_6116';

    // add your middleware config here
    config.middleware = [];
    config.cluster = {
        listen: {
            path: '',
            port: 7002,
            hostname: '0.0.0.0',
        }
    }
    config.security = {
        csrf: {
            enable: false
        }
    }
    config.multipart = {
        mode: 'file',
        // 文件大小上限：Infinity 表示不限制（默认 10MB，MC 的 jar/mod/世界备份常超此值）
        fileSize: Infinity,
        // 单次请求最多允许的文件数（默认 10）
        maxFiles: 100,
        fileExtensions: ['.dat', '.jar', '.txt', '.cfg', '.json', '.properties', '.exe', '.zip', '.tar', '.gz', '.rar', '.yml', '.yaml', '.png', '.log', '.sh', '.bat'],
    }
    // 注意，开启此模式后，应用就默认自己处于反向代理之后，
    // 会支持通过解析约定的请求头来获取用户真实的 IP，协议和域名。
    // 如果你的服务未部署在反向代理之后，请不要开启此配置，以防被恶意用户伪造请求 IP 等信息。
    config.proxy = true

    config.io = {
        init: { }, // passed to engine.io
        namespace: {
            '/': {
                connectionMiddleware: [],
                packetMiddleware: [],
            },
            '/example': {
                connectionMiddleware: [],
                packetMiddleware: [],
            },
        },
    };

    // add your user config here
    const userConfig = {
        // myAppName: 'egg',
    };

    return {
        ...config,
        ...userConfig,
    };
};

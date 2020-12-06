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
        fileExtensions: ['dat'],
    }

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

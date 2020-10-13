// TODO 待引入，下面内容暂时不生效
module.exports = {
    devServer: {
        proxy: {
            '/api': {
                // 此处的写法，目的是为了 将 /api 替换成 https://www.baidu.com/
                target: 'http://127.0.0.1:7001',
                // 允许跨域
                changeOrigin: true,
                // ws: true,
                secure: false,
                pathRewrite: {
                    '^/api': '/'
                }
            }
        }
    }
}
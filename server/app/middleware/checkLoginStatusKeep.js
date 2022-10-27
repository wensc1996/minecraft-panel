
const Response = require('../../src/response')
module.exports = () => {
    return async function checkLoginStatusKeep(ctx, next) {
        if(!ctx.session.userId) {
            ctx.body = new Response({code: -999, msg: '登录已失效，请重新登录', data : ''})
        } else {
            await next();
        }
    };
};
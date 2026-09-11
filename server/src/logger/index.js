const db = require('../mysql/connection')
class Logs {
    constructor(){
    }
    now(){
        let date = new Date();
        let Y = date.getFullYear();
        let M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1);
        let D = date.getDate()<10 ? '0'+date.getDate() : date.getDate();
        let H = date.getHours()<10 ? '0'+date.getHours() : date.getHours();
        let m = date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes();
        let s = date.getSeconds()< 10 ? '0'+date.getSeconds() : date.getSeconds();
        return (Y + '-' + M + '-' + D + ' ' + H + ':' + m + ':' + s);
    }
    log(ctx, msg) {
        // tenantId 只能来自登录态（ctx.tenantId 由 tenant 中间件挂载），绝不信任前端
        const tenantId = (ctx && ctx.tenantId !== undefined && ctx.tenantId !== null) ? ctx.tenantId
            : (ctx && ctx.session && ctx.session.tenantId)
        db.query('insert into logs (user_id, tenant_id, operation, op_time) values (?, ?, ?, ?)', [ctx.session.userId, tenantId || 0, msg, this.now()])
            .catch((err) => {
                // 写日志失败不应阻塞业务主流程，仅记录错误
                console.error('[logger] 写入操作日志失败:', err)
            })
    }
}
module.exports = Logs
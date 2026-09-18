const Response = require('../../src/response')

/**
 * 租户隔离中间件（M1 骨架）。
 * 规则：tenantId 只能来自登录态 session，绝不信任前端入参，否则可被篡改越权。
 * 登录成功后 login 服务会把 ctx.session.tenantId 写入；此处取出并挂到 ctx，供业务使用。
 */
module.exports = () => {
    return async function tenant(ctx, next) {
        const tenantId = ctx.session && ctx.session.tenantId
        if (tenantId === undefined || tenantId === null) {
            ctx.body = new Response({ code: -998, msg: '租户信息缺失，请重新登录', data: '' })
            return
        }
        // 业务侧统一从 ctx.tenantId 取，禁止读前端参数（ctx.tenantId 为"当前管理的作用域租户"）
        ctx.tenantId = tenantId
        // 身份标识：恒定，用于判定是否平台管理员、是否允许切换作用域租户
        ctx.identityTenantId = ctx.session && ctx.session.identityTenantId
        ctx.isPlatformAdmin = !!(ctx.session && ctx.session.isPlatformAdmin)
        await next()
    }
}

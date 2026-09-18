const Service = require('egg').Service;
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')
const crypto = require('crypto')
class LoginService extends Service {
    md5(val) {
        return crypto.createHash('md5').update(val).digest('hex')
    }
    async find(options) {
        const ctx = this.ctx
        const account = options.account
        const password = options.password
        if (!account || !password) {
            return new Response({ code: -1, msg: '账号或密码不能为空' })
        }
        // 账号全局唯一：一个账号唯一对应一个租户，登录即可定位租户，无需选组
        const rows = await db.query('select * from user where account = ?', [account])
        if (!rows || rows.length === 0) {
            return new Response({ code: -1, msg: '登录失败,账号或密码错误' })
        }
        const user = rows[0]
        if (user.password !== this.md5(password)) {
            return new Response({ code: -1, msg: '登录失败,账号或密码错误' })
        }
        const privileges = await db.query('select user.user_id,privilege.role_id,p.perm_id,p.perm_key,p.perm_name,p.perm_type,p.perm_key as menu_func_name from user,privilege,permission p where user.role_id = privilege.role_id and privilege.perm_id = p.perm_id and user.user_id = ?', [user.user_id])
        await db.query('update user set login_ip = ? where user_id = ?', [options.ip, user.user_id])
        delete user.password
        user.privileges = privileges
        // tenantId 恒来自库（账号全局唯一），绝不信前端提交，确保进入正确租户
        const isPlatformAdmin = (user.tenant_id === 0)
        user.isPlatformAdmin = isPlatformAdmin
        ctx.session.userId = user.user_id
        ctx.session.tenantId = user.tenant_id
        ctx.session.identityTenantId = user.tenant_id
        ctx.session.isPlatformAdmin = isPlatformAdmin
        return new Response({ code: 0, msg: '登录成功', data: user })
    }
    logout(options) {
        const ctx = this.ctx
        delete ctx.session.userId
        delete ctx.session.tenantId
        return new Response({ code: 0, msg: '退出登录成功', data: '' })
    }
}
  
module.exports = LoginService;

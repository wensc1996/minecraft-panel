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
        // 1. 按 account 找候选（同一 account 可能跨多个租户）
        let candidates = await db.query('select * from user where account = ?', [account])
        if (!candidates || candidates.length === 0) {
            return new Response({ code: -1, msg: '登录失败,账号或密码错误' })
        }
        // 2. 若前端二次提交带了 tenantId，仅用于选组定位（不参与隔离判定，隔离仍由 session 决定）
        if (options.tenantId !== undefined && options.tenantId !== null && options.tenantId !== '') {
            candidates = candidates.filter(u => String(u.tenant_id) === String(options.tenantId))
        }
        // 3. 逐条比对密码
        const matched = []
        for (const u of candidates) {
            if (u.password === this.md5(password)) matched.push(u)
        }
        if (matched.length === 0) {
            return new Response({ code: -1, msg: '登录失败,账号或密码错误' })
        }
        // 4. 多个租户均匹配 -> 返回选组提示，附带 tenant 列表（不含敏感字段）
        if (matched.length >= 2) {
            const ids = matched.map(u => u.tenant_id)
            const tenantOptions = await db.query('select tenant_id, tenant_name from tenant where tenant_id in (?)', [ids])
            const data = ids.map(id => {
                const t = (tenantOptions || []).find(x => x.tenant_id === id)
                return { tenant_id: id, tenant_name: (t && t.tenant_name) || (id === 0 ? '平台' : '') }
            })
            return new Response({ code: 2, msg: '请选择登录分组', data })
        }
        // 5. 唯一匹配：登录成功，tenantId 必须来自库，绝不信前端
        const user = matched[0]
        const privileges = await db.query('select user.user_id,privilege.role_id,p.perm_id,p.perm_key,p.perm_name,p.perm_type,p.perm_key as menu_func_name from user,privilege,permission p where user.role_id = privilege.role_id and privilege.perm_id = p.perm_id and user.user_id = ?', [user.user_id])
        await db.query('update user set login_ip = ? where user_id = ?', [options.ip, user.user_id])
        delete user.password
        user.privileges = privileges
        ctx.session.userId = user.user_id
        ctx.session.tenantId = user.tenant_id
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

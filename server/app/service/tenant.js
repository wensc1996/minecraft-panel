const Service = require('egg').Service;
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')
const crypto = require('crypto')
const fs = require('fs')

class TenantService extends Service {
    // 仅平台管理员(identityTenantId=0)可调用；列表排除平台自身(tenant_id=0)
    async getTenantList() {
        const ctx = this.ctx
        if (!ctx.isPlatformAdmin) {
            return new Response({ code: -403, msg: '仅平台管理员可查看租户列表' })
        }
        const list = await this.getTenantListData()
        return new Response({ code: 0, msg: '获取租户列表成功', data: list })
    }
    // 监控看板：租户级汇总（实例实时运行态待 M3 runtimes 多实例后增强）
    async getDashboard() {
        const ctx = this.ctx
        if (!ctx.isPlatformAdmin) {
            return new Response({ code: -403, msg: '仅平台管理员可查看监控看板' })
        }
        const tenantTotal = await db.query('select count(*) as c from tenant where tenant_id > 0')
        const tenantEnabled = await db.query('select count(*) as c from tenant where tenant_id > 0 and status = 1')
        const instanceTotal = await db.query('select count(*) as c from dispose')
        const userTotal = await db.query('select count(*) as c from user where tenant_id > 0')
        const list = await this.getTenantListData()
        return new Response({
            code: 0,
            msg: '获取监控看板成功',
            data: {
                summary: {
                    tenantTotal: tenantTotal[0].c,
                    tenantEnabled: tenantEnabled[0].c,
                    tenantDisabled: tenantTotal[0].c - tenantEnabled[0].c,
                    instanceTotal: instanceTotal[0].c,
                    userTotal: userTotal[0].c
                },
                list: list
            }
        })
    }
    // 启用/停用租户（不允许操作平台自身 tenant_id=0）
    async updateTenantStatus(options) {
        const ctx = this.ctx
        if (!ctx.isPlatformAdmin) {
            return new Response({ code: -403, msg: '仅平台管理员可操作' })
        }
        const tenantId = options.tenantId
        const status = options.status
        if (tenantId === undefined || tenantId === null || tenantId === 0 || (status !== 0 && status !== 1)) {
            return new Response({ code: -1, msg: '参数错误' })
        }
        const res = await db.query('update tenant set status = ? where tenant_id = ? and tenant_id > 0', [status, tenantId])
        if (res) {
            return new Response({ code: 0, msg: '更新租户状态成功', data: '' })
        }
        return new Response({ code: -1, msg: '更新租户状态失败' })
    }
    // 平台管理员切换"当前管理的租户"（仅改作用域 tenantId，不改身份）
    async switchTenant(options) {
        const ctx = this.ctx
        if (!ctx.isPlatformAdmin) {
            return new Response({ code: -403, msg: '仅平台管理员可切换租户' })
        }
        const target = Number(options.tenantId)
        if (isNaN(target)) {
            return new Response({ code: -1, msg: '参数错误' })
        }
        if (target === 0) {
            // 切回平台
            ctx.session.tenantId = 0
            return new Response({ code: 0, msg: '已切换回平台', data: { tenantId: 0 } })
        }
        const exist = await db.query('select tenant_id from tenant where tenant_id = ? and tenant_id > 0', [target])
        if (!exist || exist.length === 0) {
            return new Response({ code: -1, msg: '租户不存在' })
        }
        ctx.session.tenantId = target
        return new Response({ code: 0, msg: '切换租户成功', data: { tenantId: target } })
    }
    // 开通租户：创建 tenant + 存储根目录 + 默认管理员角色(全菜单权限) + 管理员账号
    async addTenant(options) {
        const ctx = this.ctx
        if (!ctx.isPlatformAdmin) {
            return new Response({ code: -403, msg: '仅平台管理员可开通租户' })
        }
        const name = options.tenantName
        const account = options.account
        const password = options.password
        if (!name || !account || !password) {
            return new Response({ code: -1, msg: '参数错误：租户名称/管理员账号/密码必填' })
        }
        const exist = await db.query('select user_id from user where account = ?', [account])
        if (exist && exist.length > 0) {
            return new Response({ code: -1, msg: '管理员账号已存在' })
        }
        const md5 = (v) => crypto.createHash('md5').update(v).digest('hex')
        try {
            const insert = await db.query('insert into tenant (tenant_name, status, create_time) values (?, 1, now())', [name])
            const tenantId = insert.insertId
            const storagePath = (options.storagePath && options.storagePath.trim()) || `/data/mcpanel/tenants/${tenantId}`
            await db.query('update tenant set storage_path = ? where tenant_id = ?', [storagePath, tenantId])
            // 确保存储根目录存在，失败回滚
            try {
                fs.mkdirSync(storagePath, { recursive: true })
            } catch (e) {
                await db.query('delete from tenant where tenant_id = ?', [tenantId])
                return new Response({ code: -1, msg: '存储目录创建失败：' + e.message })
            }
            const role = await db.query('insert into role (role_name, tenant_id) values (?, ?)', ['租户管理员', tenantId])
            const roleId = role.insertId
            // 新租户管理员角色仅授予租户级(tenant)权限（不含 platform 级）
            await db.query('insert into privilege (role_id, perm_id, tenant_id) select ?, perm_id, ? from permission where assign_scope = ?', [roleId, tenantId, 'tenant'])
            await db.query('insert into user (account, password, role_id, tenant_id, player_id) values (?, ?, ?, ?, ?)', [account, md5(password), roleId, tenantId, account])
            return new Response({ code: 0, msg: '开通租户成功', data: { tenantId } })
        } catch (e) {
            return new Response({ code: -1, msg: '开通失败：' + e.message })
        }
    }
    // 平台管理员修改租户资料（名称/到期时间/存储目录）；仅更新数据库路径，磁盘迁移由运维另行处理
    async updateTenant(options) {
        const ctx = this.ctx
        if (!ctx.isPlatformAdmin) {
            return new Response({ code: -403, msg: '仅平台管理员可操作' })
        }
        const tenantId = Number(options.tenantId)
        const name = options.tenantName
        const newPath = (options.storagePath && String(options.storagePath).trim()) || ''
        if (!tenantId || tenantId === 0 || isNaN(tenantId)) {
            return new Response({ code: -1, msg: '参数错误：租户ID无效' })
        }
        if (!name || !String(name).trim()) {
            return new Response({ code: -1, msg: '租户名称不能为空' })
        }
        // 读取当前 storage_path，用于判断路径是否变化（为空则不更新该字段）
        const cur = await db.query('select storage_path from tenant where tenant_id = ? and tenant_id > 0', [tenantId])
        if (!cur || cur.length === 0) {
            return new Response({ code: -1, msg: '租户不存在' })
        }
        const sets = ['tenant_name = ?']
        const params = [String(name).trim()]
        if (newPath && newPath !== cur[0].storage_path) {
            sets.push('storage_path = ?')
            params.push(newPath)
        }
        // expireAt：空字符串/null 表示不设到期（NULL）；否则按 datetime 原样写入
        if (options.expireAt !== undefined && options.expireAt !== null && options.expireAt !== '') {
            sets.push('expire_at = ?')
            params.push(options.expireAt)
        } else if (options.expireAt === '' || options.expireAt === null) {
            sets.push('expire_at = NULL')
        }
        params.push(tenantId)
        const res = await db.query(`update tenant set ${sets.join(', ')} where tenant_id = ? and tenant_id > 0`, params)
        if (res) {
            return new Response({ code: 0, msg: '更新租户信息成功', data: '' })
        }
        return new Response({ code: -1, msg: '更新租户信息失败' })
    }
    // 纯查询：各租户含实例数/用户数统计
    async getTenantListData() {
        return await db.query(
            `select t.tenant_id, t.tenant_name, t.storage_path, t.status, t.expire_at, t.create_time,
                (select count(*) from dispose d where d.tenant_id = t.tenant_id) as instance_count,
                (select count(*) from user u where u.tenant_id = t.tenant_id) as user_count
             from tenant t where t.tenant_id > 0 order by t.tenant_id`
        )
    }
}
module.exports = TenantService;

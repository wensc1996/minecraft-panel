const Service = require('egg').Service;
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')
const crypto = require('crypto')
const fs = require('fs')

class TenantService extends Service {
    // 仅平台管理员(tenant_id=0)可调用；列表排除平台自身(tenant_id=0)
    async getTenantList() {
        const ctx = this.ctx
        if (ctx.tenantId !== 0) {
            return new Response({ code: -403, msg: '仅平台管理员可查看租户列表' })
        }
        const list = await this.getTenantListData()
        return new Response({ code: 0, msg: '获取租户列表成功', data: list })
    }
    // 监控看板：租户级汇总（实例实时运行态待 M3 runtimes 多实例后增强）
    async getDashboard() {
        const ctx = this.ctx
        if (ctx.tenantId !== 0) {
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
        if (ctx.tenantId !== 0) {
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
    // 开通租户：创建 tenant + 存储根目录 + 默认管理员角色(全菜单权限) + 管理员账号
    async addTenant(options) {
        const ctx = this.ctx
        if (ctx.tenantId !== 0) {
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

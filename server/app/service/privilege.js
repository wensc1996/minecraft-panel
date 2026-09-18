const Service = require('egg').Service;
const { promises } = require('fs-extra');
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')
const Logs = require('../../src/logger')
const Logger = new Logs()
// 将扁平权限行构建为树（菜单 -> 页签 -> 按钮）
function buildPermissionTree (rows) {
    const map = {}
    const roots = []
    rows.forEach(r => { map[r.perm_id] = { ...r, children: [] } })
    rows.forEach(r => {
        const node = map[r.perm_id]
        if (r.parent_id && map[r.parent_id]) map[r.parent_id].children.push(node)
        else roots.push(node)
    })
    return roots
}

class PrivilegeService extends Service {
    async getRolePrivilege(options) {
        const ctx = this.ctx
        // 平台管理员权限恒为全部（不受"当前管理租户"作用域影响，避免切换租户后菜单整体消失）；
        // 租户用户仅取自身租户角色权限。始终返回 menu_func_name，否则前端 checkEnabled 隐藏所有菜单
        let sql = 'SELECT p.perm_id,p.perm_key,p.perm_name,p.perm_type,p.perm_key as menu_func_name from role,privilege,permission p where role.role_id = privilege.role_id and privilege.perm_id = p.perm_id and role.role_id = ?'
        let params = [options.roleId]
        if (!ctx.isPlatformAdmin) {
            // 兼容历史数据：平台管理员代分配租户角色时曾把 privilege.tenant_id 写成 0，
            // 这里同时接纳“角色所属租户匹配”与“tenant_id=0(历史遗留)”两种行，避免租户用户取不到按钮/菜单权限
            sql += ' and (role.tenant_id = ? OR privilege.tenant_id = 0)'
            params.push(ctx.tenantId)
        }
        let res = await db.query(sql, params)
        if(res){
            return new Response({code: 0, msg: '获取角色权限成功', data: res})
        }else{
            return new Response({code: -1, msg: '获取角色权限成功'})
        }
    }
    async getRoleList(){
        const ctx = this.ctx
        // 默认当前租户；平台管理员可传入 tenantId 查询指定租户角色（用于跨租户新增用户时选角色）
        let tenantId = ctx.tenantId
        if (ctx.isPlatformAdmin && ctx.query && ctx.query.tenantId) {
            tenantId = Number(ctx.query.tenantId)
        }
        let res = await db.query('select * from role where tenant_id = ?', [tenantId])
        if(res){
            return new Response({code: 0, msg: '获取角色列表成功', data: res})
        }else{
            return new Response({code: -1, msg: '获取角色列表失败'})
        }
    }
    async createRole(options) {
        const ctx = this.ctx
        const roleName = (options.roleName || '').trim()
        if (!roleName) return new Response({ code: -1, msg: '角色名称不能为空' })
        // 租户仅能在其自身租户下建角色；平台管理员可指定 tenantId（默认当前租户）
        let tenantId = ctx.tenantId
        if (ctx.isPlatformAdmin && options.tenantId) {
            tenantId = Number(options.tenantId)
        }
        try {
            const res = await db.query('insert into role (tenant_id, role_name) values (?, ?)', [tenantId, roleName])
            Logger.log(this.ctx, `新增角色：${roleName}(tenant_id=${tenantId})`)
            return new Response({ code: 0, msg: '新增角色成功', data: { roleId: res.insertId } })
        } catch (e) {
            return new Response({ code: -1, msg: '新增角色失败：' + (e && e.message ? e.message : e) })
        }
    }
    async deleteRole(options) {
        const ctx = this.ctx
        const roleId = options.roleId
        if (!roleId) return new Response({ code: -1, msg: '角色ID不能为空' })
        // 平台超级管理员(role_id=1)不可删除，避免系统失管
        if (Number(roleId) === 1) return new Response({ code: -1, msg: '平台超级管理员角色不可删除' })
        const roleRows = await db.query('select tenant_id from role where role_id = ?', [roleId])
        if (!roleRows || roleRows.length === 0) return new Response({ code: -1, msg: '角色不存在' })
        // 越权防护：租户只能删除自身租户下的角色
        if (!ctx.isPlatformAdmin && roleRows[0].tenant_id !== ctx.tenantId) {
            return new Response({ code: -1, msg: '无权删除该角色' })
        }
        // 禁止删除仍有用户挂靠的角色，避免用户权限悬空
        const used = await db.query('select user_id from user where role_id = ? limit 1', [roleId])
        if (used && used.length > 0) {
            return new Response({ code: -1, msg: '该角色已分配给用户，请先移除相关用户后再删除' })
        }
        try {
            await db.transaction([
                { sql: 'delete from privilege where role_id = ?', params: [roleId] },
                { sql: 'delete from role where role_id = ?', params: [roleId] },
            ])
            Logger.log(this.ctx, `删除角色：${roleId}`)
            return new Response({ code: 0, msg: '删除角色成功' })
        } catch (e) {
            return new Response({ code: -1, msg: '删除角色失败：' + (e && e.message ? e.message : e) })
        }
    }
    async getPrivilegeList(){
        // 权限树为全局定义；按调用方租户过滤可分配范围：
        // 平台管理员(identityTenantId=0) 看到全部；租户仅看到 assign_scope='tenant' 的节点
        const ctx = this.ctx
        let sql = 'select * from permission'
        if (!ctx.isPlatformAdmin) sql += " where assign_scope = 'tenant'"
        sql += ' order by parent_id, sort, perm_id'
        let res = await db.query(sql)
        if(res){
            return new Response({code: 0, msg: '获取权限菜单成功', data: buildPermissionTree(res)})
        }else{
            return new Response({code: -1, msg: '获取权限菜单失败'})
        }
    }
    async updatePrivilege(options) {
        const ctx = this.ctx
        let permIds = options.privilgeList || []
        // 安全边界：非平台管理员只能分配 tenant 级权限，提交的 platform 级节点直接丢弃
        if (!ctx.isPlatformAdmin) {
            const allowed = await db.query("select perm_id from permission where assign_scope = 'tenant'")
            const allowSet = new Set(allowed.map(x => x.perm_id))
            permIds = permIds.filter(id => allowSet.has(Number(id)))
        }
        // 以“角色实际所属租户”写入 privilege.tenant_id，避免平台管理员代分配时写 0 导致租户用户权限取回时 tenant 不匹配、按钮/菜单整片消失
        const roleRows = await db.query('select tenant_id from role where role_id = ?', [options.roleId])
        const roleTenantId = (roleRows && roleRows.length) ? roleRows[0].tenant_id : ctx.tenantId
        // 在同一事务里先清空旧权限分配，再顺序批量插入新权限，保证原子性
        try {
            await db.transaction([
                {
                    sql: 'delete from privilege where role_id = ? and tenant_id = ?',
                    params: [options.roleId, roleTenantId],
                },
                ...permIds.map((item) => ({
                    sql: 'insert into privilege(tenant_id, role_id, perm_id) values (?, ?, ?)',
                    params: [roleTenantId, options.roleId, item],
                })),
            ])
            Logger.log(this.ctx, `分配权限菜单`)
            return new Response({code: 0, msg: '分配权限菜单成功', data: ''})
        } catch (err){
            return new Response({code: -1, msg: '分配权限菜单失败'})
        }
    }
}
  
module.exports = PrivilegeService;

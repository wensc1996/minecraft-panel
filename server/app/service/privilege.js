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
        // 租户隔离：角色权限属于当前租户
        let res = await db.query('SELECT p.perm_id,p.perm_key,p.perm_name,p.perm_type from role,privilege,permission p where role.role_id = privilege.role_id and privilege.perm_id = p.perm_id and role.role_id = ? and role.tenant_id = ?', [options.roleId, ctx.tenantId])
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
        if (ctx.tenantId === 0 && ctx.query && ctx.query.tenantId) {
            tenantId = Number(ctx.query.tenantId)
        }
        let res = await db.query('select * from role where tenant_id = ?', [tenantId])
        if(res){
            return new Response({code: 0, msg: '获取角色列表成功', data: res})
        }else{
            return new Response({code: -1, msg: '获取角色列表失败'})
        }
    }
    async getPrivilegeList(){
        // 权限树为全局定义；按调用方租户过滤可分配范围：
        // 平台管理员(tenant_id=0) 看到全部；租户仅看到 assign_scope='tenant' 的节点
        const ctx = this.ctx
        let sql = 'select * from permission'
        if (ctx.tenantId !== 0) sql += " where assign_scope = 'tenant'"
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
        // 安全边界：租户只能分配 tenant 级权限，提交的 platform 级节点直接丢弃
        if (ctx.tenantId !== 0) {
            const allowed = await db.query("select perm_id from permission where assign_scope = 'tenant'")
            const allowSet = new Set(allowed.map(x => x.perm_id))
            permIds = permIds.filter(id => allowSet.has(Number(id)))
        }
        // 在同一事务里先清空旧权限分配，再顺序批量插入新权限，保证原子性
        try {
            await db.transaction([
                {
                    sql: 'delete from privilege where role_id = ? and tenant_id = ?',
                    params: [options.roleId, ctx.tenantId],
                },
                ...permIds.map((item) => ({
                    sql: 'insert into privilege(tenant_id, role_id, perm_id) values (?, ?, ?)',
                    params: [ctx.tenantId, options.roleId, item],
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

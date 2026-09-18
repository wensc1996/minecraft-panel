const Service = require('egg').Service;
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')
const fs = require('fs')
const crypto = require('crypto')
const Logs = require('../../src/logger')
const Logger = new Logs()
class UserService extends Service {
    md5(val) {
        return crypto.createHash('md5').update(val).digest('hex')
    }
    async getUserList() {
        const ctx = this.ctx
        // 租户隔离：默认只查当前租户；平台管理员可传入 tenantId 查看指定租户用户
        let tenantId = ctx.tenantId
        if (ctx.tenantId === 0 && ctx.query && ctx.query.tenantId) {
            tenantId = Number(ctx.query.tenantId)
        }
        let res = await db.query('select user_id,player_id,login_ip,role_name as role from user,role where user.role_id = role.role_id and user.tenant_id = ?', [tenantId])
        return new Response({code: 0, msg: '查询成功', data : res})
    }
    async updatePassword(options) {
        const ctx = this.ctx
        let oldInfo = await db.query('select * from user where user_id = ? and tenant_id = ?', [options.userId, ctx.tenantId])
        if(oldInfo[0].password == this.md5(options.oldPassword)){
            let res = await db.query('update user set password = ? where user_id = ? and tenant_id = ?', [this.md5(options.password), options.userId, ctx.tenantId])
            if(res){
                Logger.log(this.ctx, `修改密码：${[this.md5(options.password), options.userId].join(',')}`)
                return new Response({code: 0, msg: '修改密码成功', data: res})
            }else{
                return new Response({code: -1, msg: '修改密码失败', data: ''})
            }
        }   
    }
    async addNewUser(options) {
        const ctx = this.ctx
        // 目标租户：普通用户强制当前租户；平台管理员必须显式选择租户(tenant_id>0)，绝不信任前端的当前租户以外值
        let targetTenantId = ctx.tenantId
        if (ctx.tenantId === 0) {
            if (options.tenantId === undefined || options.tenantId === null || options.tenantId === '' || Number(options.tenantId) <= 0) {
                return new Response({ code: -1, msg: '平台管理员新增用户必须选择所属租户' })
            }
            targetTenantId = Number(options.tenantId)
        }
        // 校验所选角色确实属于目标租户，防止越权挂靠
        const roleCheck = await db.query('select role_id from role where role_id = ? and tenant_id = ?', [options.roleId, targetTenantId])
        if (!roleCheck || roleCheck.length === 0) {
            return new Response({ code: -1, msg: '所选角色不属于目标租户' })
        }
        // 登录账号必填，且全局唯一（uk_account）：一个账号唯一对应一个租户
        if (!options.account) {
            return new Response({ code: -1, msg: '登录账号不能为空' })
        }
        const accountCheck = await db.query('select user_id from user where account = ?', [options.account])
        if (accountCheck && accountCheck.length > 0) {
            return new Response({ code: -1, msg: '登录账号已存在' })
        }
        let res = await db.query('insert into user(account, player_id, login_ip, role_id, password, tenant_id) values (?, ?, ?, ?, ?, ?)', [options.account, options.playerId, options.loginIp, options.roleId, this.md5(options.password), targetTenantId])
        if(res){
            Logger.log(this.ctx, `新增用户：${[options.playerId, options.loginIp, options.roleId, this.md5(options.password)].join(',')}`)
            return new Response({code: 0, msg: '新增用户成功', data: res})
        }else{
            return new Response({code: -1, msg: '新增用户失败', data: ''})
        }
    }
    async updatePlayerId(options) {
        const ctx = this.ctx
        let res = await db.query('update user set player_id = ? where user_id = ? and tenant_id = ?', [options.playerId, options.userId, ctx.tenantId])
        if(res){
            Logger.log(this.ctx, `修改游戏ID：${[options.playerId, options.userId].join(',')}`)
            return new Response({code: 0, msg: '修改游戏ID成功', data: res})
        }else{
            return new Response({code: -1, msg: '修改游戏ID失败', data: ''})
        }
    }
    async deleteUser(options) {
        const ctx = this.ctx
        let res = await db.query('delete from user where user_id = ? and tenant_id = ?', [options.userId, ctx.tenantId])
        if(res){
            Logger.log(this.ctx, `删除用户：${options.userId}`)
            return new Response({code: 0, msg: '删除用户成功', data: res})
        }else{
            return new Response({code: -1, msg: '删除用户失败', data: ''})
        }
    }
}
  
module.exports = UserService;

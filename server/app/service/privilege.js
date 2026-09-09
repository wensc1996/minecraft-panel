const Service = require('egg').Service;
const { promises } = require('fs-extra');
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')
const Logs = require('../../src/logger')
const Logger = new Logs()
class PrivilegeService extends Service {
    async getRolePrivilege(options) {

        let res = await db.query('SELECT menu.menu_id,menu_func_name,menu_name from role,privilege,menu where role.role_id = privilege.role_id and privilege.menu_id = menu.menu_id and role.role_id = ?', options.roleId)
        if(res){
            return new Response({code: 1, msg: '获取角色权限成功', data: res})
        }else{
            return new Response({code: -1, msg: '获取角色权限成功'})
        }
    }
    async getRoleList(){

        let res = await db.query('select * from role')
        if(res){
            return new Response({code: 1, msg: '获取角色列表成功', data: res})
        }else{
            return new Response({code: -1, msg: '获取角色列表失败'})
        }
    }
    async getPrivilegeList(){
        let res = await db.query('select * from menu')
        if(res){
            return new Response({code: 1, msg: '获取权限菜单成功', data: res})
        }else{
            return new Response({code: -1, msg: '获取权限菜单失败'})
        }
    }
    async updatePrivilege(options) {
        // 在同一事务里先清空旧权限分配，再顺序批量插入新权限，保证原子性
        try {
            await db.transaction([
                {
                    sql: 'delete from privilege where role_id = ?',
                    params: [options.roleId],
                },
                ...options.privilgeList.map((item) => ({
                    sql: 'insert into privilege(role_id, menu_id) values (?, ?)',
                    params: [options.roleId, item],
                })),
            ])
            Logger.log(this.ctx, `分配权限菜单`)
            return new Response({code: 1, msg: '分配权限菜单成功', data: ''})
        } catch (err){
            return new Response({code: -1, msg: '分配权限菜单失败'})
        }
    }
}
  
module.exports = PrivilegeService;
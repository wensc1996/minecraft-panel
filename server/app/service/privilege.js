const Service = require('egg').Service;
const { promises } = require('fs-extra');
const Mysql = require('../../src/mysql/connection')
const Response = require('../../src/response')
class PrivilegeService extends Service {
    async getRolePrivilege(options) {
        let mysql = new Mysql()
        let res = await mysql.action('SELECT menu.menu_id,menu_func_name,menu_name from role,privilege,menu where role.role_id = privilege.role_id and privilege.menu_id = menu.menu_id and role.role_id = ?', options.roleId)
        if(res){
            return new Response({code: 1, msg: '获取角色权限成功', data: res})
        }else{
            return new Response({code: -1, msg: '获取角色权限成功'})
        }
    }
    async getRoleList(){
        let mysql = new Mysql()
        let res = await mysql.action('select * from role')
        if(res){
            return new Response({code: 1, msg: '获取角色列表成功', data: res})
        }else{
            return new Response({code: -1, msg: '获取角色列表失败'})
        }
    }
    async getPrivilegeList(){
        let mysql = new Mysql()
        let res = await mysql.action('select * from menu')
        if(res){
            return new Response({code: 1, msg: '获取权限菜单成功', data: res})
        }else{
            return new Response({code: -1, msg: '获取权限菜单失败'})
        }
    }
    async updatePrivilege(options) {
        let mysql = new Mysql()
        // 有点效率低下的做法，但是因为数据量较少，影响不大
        try {
            await mysql.batchAction('delete from privilege where role_id = ?', options.roleId)
            let all = Promise.all(options.privilgeList.map((item) => {
                return mysql.batchAction('insert into privilege(role_id, menu_id) values (?, ?)', [options.roleId, item])
            }))
            await all
            return new Response({code: 1, msg: '分配权限菜单成功', data: ''})
        } catch (err){
            return new Response({code: -1, msg: '分配权限菜单失败'})
        } finally {
            mysql.closeMysql()
        }
    }
}
  
module.exports = PrivilegeService;
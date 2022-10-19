const Service = require('egg').Service;
const Mysql = require('../../src/mysql/connection')
const Response = require('../../src/response')
const crypto = require('crypto')
class LoginService extends Service {
    md5(val) {
        return crypto.createHash('md5').update(val).digest('hex')
    }
    async find(options) {
        const ctx = this.ctx
        const mysql = new Mysql()
        let res = await mysql.action('select * from user where user_id = ?', options.userId)
        let privileges = await mysql.action('select user.user_id,privilege.role_id,menu.menu_id,menu_func_name,menu_name from user,privilege,menu where user.role_id = privilege.role_id and privilege.menu_id = menu.menu_id and user.user_id = ?', options.userId)
        if(res.length && res[0].password == this.md5(options.password)){
            let updateIp = await mysql.action('update user set login_ip = ? where user_id = ?', [options.ip, options.userId])
            delete res[0].password
            res[0].privileges = privileges
            ctx.session.userId = options.userId
            return new Response({code: 1, msg: '登录成功', data: res[0]})
        }else{
            return new Response({code: -1, msg: '登录失败,账号或密码错误'})
        }
    }
}
  
module.exports = LoginService;
const Service = require('egg').Service;
const Mysql = require('../../src/mysql/connection')
const Response = require('../../src/response')
const crypto = require('crypto')
class LoginService extends Service {
    md5(val) {
        return crypto.createHash('md5').update(val).digest('hex')
    }
    async find(options) {
        let mysql = new Mysql()
        let res = await mysql.action('select * from user where user_id = ?', options.userId)
        if(res[0].password == this.md5(options.password)){
            let updateIp = await mysql.action('update user set login_ip = ? where user_id = ?', [options.ip, options.userId])
            delete res[0].password
            return new Response({code: 1, msg: '登录成功', data: res[0]})
        }else{
            return new Response({code: -1, msg: '登录失败,账号或密码错误'})
        }
    }
}
  
module.exports = LoginService;
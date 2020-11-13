const Service = require('egg').Service;
const Mysql = require('../../src/mysql/connection')
const Response = require('../../src/response')
class LoginService extends Service {
    async find(options) {
        let mysql = new Mysql()
        let res = await mysql.action('select * from user where user_id = ?', options.userId)
        if(res[0].password == options.password){
            return new Response({code: 1, msg: '登录成功', data : res[0]})
        }else{
            return new Response({code: -1, msg: '登录失败,账号或密码错误'})
        }
    }
}
  
module.exports = LoginService;
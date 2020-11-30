const Service = require('egg').Service;
const Mysql = require('../../src/mysql/connection')
const Response = require('../../src/response')
const fs = require('fs')
const crypto = require('crypto')
class UserService extends Service {
    md5(val) {
        return crypto.createHash('md5').update(val).digest('hex')
    }
    async getUserList() {
        let mysql = new Mysql()
        let res = await mysql.action('select user_id,player_id,login_ip,role from user')
        return new Response({code: 1, msg: '查询成功', data : res})
    }
    async updatePassword(options) {
        let mysql = new Mysql()
        let oldInfo = await mysql.action('select * from user where user_id = ?', options.userId)
        if(oldInfo[0].password == this.md5(options.oldPassword)){
            let res = await mysql.action('update user set password = ? where user_id = ?', [this.md5(options.password), options.userId])
            if(res){
                return new Response({code: 1, msg: '修改密码成功', data : res})
            }else{
                return new Response({code: -1, msg: '修改密码失败', data: ''})
            }
        }   
    }
    async addNewUser(options) {
        let mysql = new Mysql()
        let res = await mysql.action('insert into user(player_id, login_ip, role, password) values (?, ?, ?, ?)', [options.playerId, options.loginIp, options.role, this.md5(options.password)])
        if(res){
            return new Response({code: 1, msg: '新增用户成功', data : res})
        }else{
            return new Response({code: -1, msg: '新增用户失败', data: ''})
        }
    }
    async deleteUser(options) {
        let mysql = new Mysql()
        let res = await mysql.action('delete from user where user_id = ?', options.userId)
        if(res){
            return new Response({code: 1, msg: '删除用户成功', data : res})
        }else{
            return new Response({code: -1, msg: '删除用户失败', data: ''})
        }
    }
    readFile(){
        return new Promise((resolve, reject) => {
            fs.readdir('../mc/world/players', 'utf-8', function(err, data){
                resolve(data)
            })
        })
    }
    async getPlayerList() {
        let res = await this.readFile()
        res = JSON.parse(JSON.stringify(res).replace(/.dat/g, ''))
        if(res){
            return new Response({code: 1, msg: '获取玩家列表成功', data : res.map((item) => {
                return {
                    name: item
                }
            })})
        }else{
            return new Response({code: -1, msg: '获取玩家列表失败', data: ''})
        }
    }
    deleteFile(options) {
        return new Promise((resolve, reject) => {
            fs.unlink(`../mc/world/players/${options.playerId}.dat`, function(err, data){
                if(err) resolve('删除失败')
                else resolve('删除成功')
            })
        })
    }
    async deletePlayer(options) {
        let res = await this.deleteFile(options)
        return new Response({code: 1, msg: res, data: res})
    }
}
  
module.exports = UserService;
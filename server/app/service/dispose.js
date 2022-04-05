const Service = require('egg').Service;
const Mysql = require('../../src/mysql/connection')
const Response = require('../../src/response')
class DisposeService extends Service {
    async getGameDispose() {
        let mysql = new Mysql()
        let res = await mysql.action('select * from dispose')
        if(res){
            return new Response({code: 1, msg: '获取游戏配置成功', data: res[0]})
        }else{
            return new Response({code: -1, msg: '获取游戏配置失败'})
        }
    }
    async updateGameDispose(options) {
        let mysql = new Mysql()
        let res = await mysql.action('update dispose set game_port = ?, panel_port = ?, max_players = ?, max_memory_size = ?, min_memory_size = ?, jar_name = ?, java_path = ?', [options.gamePort, options.panelPort, options.playerNum, options.maxMemorySize, options.minMemorySize, options.jarName, options.javaPath])
        if(res){
            return new Response({code: 1, msg: '更新游戏配置成功', data: ''})
        }else{
            return new Response({code: -1, msg: '更新游戏配置失败'})
        }
    }
}
  
module.exports = DisposeService;
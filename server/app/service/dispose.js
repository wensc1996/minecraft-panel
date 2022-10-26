const Service = require('egg').Service;
const Mysql = require('../../src/mysql/connection')
const Response = require('../../src/response')
const Logs = require('../../src/logger')
const Logger = new Logs()
class DisposeService extends Service {
    mysql = new Mysql()
    async getGameDispose() {
        let res = await this.mysql.action('select * from dispose')
        if(res){
            return new Response({code: 1, msg: '获取游戏配置成功', data: res[0]})
        }else{
            return new Response({code: -1, msg: '获取游戏配置失败'})
        }
    }
    async updateGameDispose(options) {
        let res = await this.mysql.action('update dispose set game_port = ?, panel_port = ?, max_players = ?, max_memory_size = ?, min_memory_size = ?, jar_name = ?, java_path = ?, work_path = ?', [options.gamePort, options.panelPort, options.playerNum, options.maxMemorySize, options.minMemorySize, options.jarName, options.javaPath, options.workPath])
        if(res){
            Logger.log(this.ctx, `更新游戏配置:${[options.gamePort, options.panelPort, options.playerNum, options.maxMemorySize, options.minMemorySize, options.jarName, options.javaPath].join(',')}`)
            return new Response({code: 1, msg: '更新游戏配置成功', data: ''})
        }else{
            return new Response({code: -1, msg: '更新游戏配置失败'})
        }
    }
}
  
module.exports = DisposeService;
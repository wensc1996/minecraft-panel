const Service = require('egg').Service;
const Response = require('../../src/response')
const fs = require('fs-extra')

class PlayerFilesService extends Service {
    copyFile(source, target){
        return new Promise((resolve, reject) => {
            fs.copy(source, target, function (err) {
                if (err) return console.error(err); 
                resolve('复制成功')
            }) //拷贝文件
        })
    }
    async backupPlayer(options) {
        let res = await this.copyFile('../mc/world/players', '../mc/world/backup')
        if(res){
            return new Response({code: 1, msg: '备份玩家成功', data : res})
        }else{
            return new Response({code: -1, msg: '恢复玩家存档失败'})
        }
    }
    async restorePlayer(options){
        let res = await this.copyFile('../mc/world/backup/wensc.dat', '../mc/world/players/wensc.dat')
        if(res){
            return new Response({code: 1, msg: '恢复玩家存档成功', data : ''})
        }else{
            return new Response({code: -1, msg: '恢复玩家存档失败'})
        }
    }
}
  
module.exports = PlayerFilesService;
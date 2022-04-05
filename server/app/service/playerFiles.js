const Service = require('egg').Service;
const Response = require('../../src/response')
const fs = require('fs')

class PlayerFilesService extends Service {
    copyFile(source, target){
        return new Promise((resolve, reject) => {
            fs.copyFile(source, target, function (err) {
                if (err) return console.error(err); 
                resolve('复制成功')
            }) //拷贝文件
        })
    }
    getPlayerFileList() {
        return new Promise((resolve, reject) => {
            fs.readdir(`../mc/world/players`, (err, files) => {
                if(err) {
                    resolve(new Response({code: -1, msg: '获取玩家存档失败'}))
                } else {
                    resolve(new Response({code: 1, msg: '获取玩家存档成功', data : files}))
                }
            })
        })
    }
    makeSureDirectoryExit(){
        return new Promise((resolve, reject) => {
            fs.access("../mc/world/backup",function(err){
                //    文件和目录不存在的情况下；
                if(err){
                    fs.mkdir('../mc/world/backup', function(error){
                        if(!error){
                            resolve(1)
                        }else{
                            resolve(0)
                        }
                    })
                }else{
                    resolve(1)
                }
            })
        })
    }
    async backupPlayer(options) {
        let dirExits = await this.makeSureDirectoryExit()
        let res = ''
        if(dirExits) res = await this.copyFile(`../mc/world/players/${options.playerId}`, `../mc/world/backup/${options.playerId}`)
        if(res){
            return new Response({code: 1, msg: '备份玩家成功', data : res})
        }else{
            return new Response({code: -1, msg: '恢复玩家存档失败'})
        }
    }
    async restorePlayer(options){
        let res = await this.copyFile(`../mc/world/backup/${options.playerId}`, `../mc/world/players/${options.playerId}`)
        if(res){
            return new Response({code: 1, msg: '恢复玩家存档成功', data : ''})
        }else{
            return new Response({code: -1, msg: '恢复玩家存档失败'})
        }
    }
    async uploadFile(options){
        try {
            let file = options.files[0]
            let wfile = fs.readFileSync(file.filepath)
            fs.writeFileSync(`../mc/world/players/${file.filename}`, wfile)
            return new Response({code: 1, msg: '上传成功', data : ''})
        } catch (err) {
            return new Response({code: -1, msg: '上传失败' + err, data : ''})
        }
    }
    deleteFile(options) {
        return new Promise((resolve, reject) => {
            fs.unlink(`../mc/world/players/${options.playerId}`, function(err, data){
                if(err) resolve(0)
                else resolve(1)
            })
        })
    }
    async deletePlayer(options) {
        let res = await this.deleteFile(options)
        if(res) {
            return new Response({code: 1, msg: '删除成功', data : ''})
        } else {
            return new Response({code: -1, msg: '删除失败', data : ''})
        }
    }
}
  
module.exports = PlayerFilesService;
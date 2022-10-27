const Service = require('egg').Service;
const path = require('path');
const fs = require('fs')
const Response = require('../../src/response')
const Logs = require('../../src/logger')
const GameConfig = require('../../src/gameConfig');
const Logger = new Logs()
let work_path = null
class PlayerFilesService extends Service {
    copyFile(source, target){
        return new Promise((resolve, reject) => {
            fs.copyFile(source, target, function (err) {
                if (err) return console.error(err); 
                resolve('复制成功')
            }) //拷贝文件
        })
    }
    async getPlayerFileList() {
        let checkConfig = new GameConfig()
        await checkConfig.getGameConfig()
        let checkResult = await checkConfig.checkGamePathConfig()
        if(checkResult.code != 1) {
            return new Response({code: checkResult.code, msg: checkResult.msg, data : ''})
        } else {
            work_path = checkConfig.config.work_path
            return new Promise((resolve, reject) => {
                fs.readdir(path.join(work_path, '/world/players'), (err, files) => {
                    if(err) {
                        resolve(new Response({code: -1, msg: '获取玩家存档失败'}))
                    } else {
                        resolve(new Response({code: 1, msg: '获取玩家存档成功', data : files}))
                    }
                })
            })
        }
    }
    makeSureDirectoryExit(){
        return new Promise((resolve, reject) => {
            fs.access(path.join(work_path, "/world/backup"),function(err){
                //    文件和目录不存在的情况下；
                if(err){
                    fs.mkdir(path.join(work_path, "/world/backup"), function(error){
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
        if(dirExits) res = await this.copyFile(path.join(work_path, `/world/players/${options.playerId}`) , path.join(work_path, `/world/backup/${options.playerId}`))
        if(res){
            Logger.log(this.ctx, `备份玩家存档：${options.playerId}`)
            return new Response({code: 1, msg: '备份玩家成功', data : res})
        }else{
            return new Response({code: -1, msg: '恢复玩家存档失败'})
        }
    }
    async restorePlayer(options){
        let res = await this.copyFile(path.join(work_path, `/world/backup/${options.playerId}`), path.join(work_path, `/world/players/${options.playerId}`))
        if(res){
            Logger.log(this.ctx, `恢复玩家存档：${options.playerId}`)
            return new Response({code: 1, msg: '恢复玩家存档成功', data : ''})
        }else{
            return new Response({code: -1, msg: '恢复玩家存档失败'})
        }
    }
    async uploadFile(options){
        if(work_path == null) {
            return new Response({code: -1, msg: '上传失败，请先配置游戏目录', data : ''})
        }
        try {
            let file = options.files[0]
            Logger.log(this.ctx, `上传玩家存档：${file.filename}`)
            let wfile = fs.readFileSync(file.filepath)
            fs.writeFileSync(path.join(work_path, `/world/players/${file.filename}`), wfile)
            return new Response({code: 1, msg: '上传成功', data : ''})
        } catch (err) {
            return new Response({code: -1, msg: '上传失败' + err, data : ''})
        }
    }
    deleteFile(options) {
        return new Promise((resolve, reject) => {
            fs.unlink(path.join(work_path, `/world/players/${options.playerId}`), function(err, data){
                if(err) resolve(0)
                else resolve(1)
            })
        })
    }
    async deletePlayer(options) {
        let res = await this.deleteFile(options)
        if(res) {
            Logger.log(this.ctx, `删除玩家存档：${options.playerId}`)
            return new Response({code: 1, msg: '删除成功', data : ''})
        } else {
            return new Response({code: -1, msg: '删除失败', data : ''})
        }
    }
}
  
module.exports = PlayerFilesService;
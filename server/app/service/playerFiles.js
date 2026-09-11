const Service = require('egg').Service;
const path = require('path');
const fs = require('fs')
const Response = require('../../src/response')
const Logs = require('../../src/logger')
const Logger = new Logs()
const db = require('../../src/mysql/connection')
const { buildWorkPath } = require('../../src/instancePath')
class PlayerFilesService extends Service {
    // 解析当前实例的 work_path：由租户 storage_path + 实例 name 拼接（不落库），并校验目录存在
    async resolveWorkPath(instanceId) {
        const tenantId = this.ctx.tenantId
        if (!instanceId) return new Response({ code: -1, msg: '缺少 instanceId' })
        const rows = await db.query(
            'select d.name, t.storage_path from dispose d left join tenant t on t.tenant_id = d.tenant_id where d.instance_id = ? and d.tenant_id = ?',
            [instanceId, tenantId]
        )
        if (!rows || !rows.length || !rows[0].storage_path || !rows[0].name) {
            return new Response({ code: -1, msg: '尚未设置游戏目录' })
        }
        const wp = buildWorkPath(rows[0].storage_path, rows[0].name)
        if (!fs.existsSync(wp)) {
            return new Response({ code: -1, msg: '游戏目录不存在' })
        }
        return new Response({ code: 0, data: wp })
    }
    copyFile(source, target){
        return new Promise((resolve, reject) => {
            fs.copyFile(source, target, function (err) {
                if (err) return console.error(err); 
                resolve('复制成功')
            }) //拷贝文件
        })
    }
    async getPlayerFileList(options) {
        const rp = await this.resolveWorkPath(options.instanceId)
        if (rp.code != 0) return rp
        const workPath = rp.data
        return new Promise((resolve, reject) => {
            fs.readdir(path.join(workPath, '/world/players'), (err, files) => {
                if(err) {
                    resolve(new Response({code: -1, msg: '获取玩家存档失败'}))
                } else {
                    resolve(new Response({code: 0, msg: '获取玩家存档成功', data : files}))
                }
            })
        })
    }
    makeSureDirectoryExit(workPath){
        return new Promise((resolve, reject) => {
            fs.access(path.join(workPath, "/world/backup"),function(err){
                //    文件和目录不存在的情况下；
                if(err){
                    fs.mkdir(path.join(workPath, "/world/backup"), function(error){
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
        const rp = await this.resolveWorkPath(options.instanceId)
        if (rp.code != 0) return rp
        const workPath = rp.data
        let dirExits = await this.makeSureDirectoryExit(workPath)
        let res = ''
        if(dirExits) res = await this.copyFile(path.join(workPath, `/world/players/${options.playerId}`) , path.join(workPath, `/world/backup/${options.playerId}`))
        if(res){
            Logger.log(this.ctx, `备份玩家存档：${options.playerId}`)
            return new Response({code: 0, msg: '备份玩家成功', data : res})
        }else{
            return new Response({code: -1, msg: '恢复玩家存档失败'})
        }
    }
    async restorePlayer(options){
        const rp = await this.resolveWorkPath(options.instanceId)
        if (rp.code != 0) return rp
        const workPath = rp.data
        let res = await this.copyFile(path.join(workPath, `/world/backup/${options.playerId}`), path.join(workPath, `/world/players/${options.playerId}`))
        if(res){
            Logger.log(this.ctx, `恢复玩家存档：${options.playerId}`)
            return new Response({code: 0, msg: '恢复玩家存档成功', data : ''})
        }else{
            return new Response({code: -1, msg: '恢复玩家存档失败'})
        }
    }
    async uploadFile(options){
        const instanceId = options.body && options.body.instanceId
        const rp = await this.resolveWorkPath(instanceId)
        if (rp.code != 0) return rp
        const workPath = rp.data
        try {
            let file = options.files[0]
            Logger.log(this.ctx, `上传玩家存档：${file.filename}`)
            let wfile = fs.readFileSync(file.filepath)
            fs.writeFileSync(path.join(workPath, `/world/players/${file.filename}`), wfile)
            return new Response({code: 0, msg: '上传成功', data : ''})
        } catch (err) {
            return new Response({code: -1, msg: '上传失败' + err, data : ''})
        }
    }
    deleteFile(workPath, playerId) {
        return new Promise((resolve, reject) => {
            fs.unlink(path.join(workPath, `/world/players/${playerId}`), function(err, data){
                if(err) resolve(0)
                else resolve(1)
            })
        })
    }
    async deletePlayer(options) {
        const rp = await this.resolveWorkPath(options.instanceId)
        if (rp.code != 0) return rp
        const workPath = rp.data
        let res = await this.deleteFile(workPath, options.playerId)
        if(res) {
            Logger.log(this.ctx, `删除玩家存档：${options.playerId}`)
            return new Response({code: 0, msg: '删除成功', data : ''})
        } else {
            return new Response({code: -1, msg: '删除失败', data : ''})
        }
    }
}
  
module.exports = PlayerFilesService;

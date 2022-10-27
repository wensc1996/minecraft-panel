const Mysql = require('../mysql/connection')
const fs = require('fs');
class checkGameConfig {
    mysql = new Mysql()
    constructor(){
    }
    async getGameConfig() {
        let res = await this.mysql.action('select * from dispose')
        if(res.length > 0) {
            this.config = res[0]
        } else {
            this.config = null
        }
    }
    checkFileExist(path) {
        return new Promise((resolve, reject) => {
            fs.access(path, fs.constants.F_OK, (err) => {
                if(err) {
                    resolve(false)
                } else {
                    resolve(true)
                }
            });
        })
    }
    async checkGamePathConfig() {
        if(!this.config) {
            return {
                code: -1,
                msg: '尚未配置游戏启动参数'
            }
        }
        if(!this.config.work_path) {
            return {
                code: -1,
                msg: '尚未设置游戏目录'
            }
        } else {
            let isExist = await this.checkFileExist(this.config.work_path)
            if(!isExist) {
                return {
                    code: -1,
                    msg: '游戏目录不存在'
                }
            }
        }
        return {
            code: 1,
            msg: '运行时配置完成'
        }
    }
    async checkRunConfig() {
        if(!this.config) {
            return {
                code: -1,
                msg: '尚未配置游戏启动参数'
            }
        }
        if(!this.config.java_path) {
            return {
                code: -1,
                msg: '尚未设置JAVA路径'
            }
        } else {
            let isExist = await this.checkFileExist(this.config.java_path)
            if(!isExist) {
                return {
                    code: -1,
                    msg: 'JAVA路径错误'
                }
            }
        }
        if(!this.config.min_memory_size) {
            return {
                code: -1,
                msg: '尚未设置最小堆空间'
            }
        }
        if(!this.config.max_memory_size) {
            return {
                code: -1,
                msg: '尚未设置最大堆空间'
            }
        }
        if(!this.config.work_path) {
            return {
                code: -1,
                msg: '尚未设置游戏目录'
            }
        }
        if(!this.config.jar_name) {
            return {
                code: -1,
                msg: '尚未设置服务端核心文件名'
            }
        }
        if(this.config.work_path && this.config.jar_name) {
            let isExist = await this.checkFileExist(this.config.work_path + '/' + this.config.jar_name)
            if(!isExist) {
                return {
                    code: -1,
                    msg: '服务端文件在游戏目录不存在'
                }
            }
        }
        return {
            code: 1,
            msg: '运行时配置完成'
        }
    }
}
module.exports = checkGameConfig
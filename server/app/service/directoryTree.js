const Service = require('egg').Service;
const Response = require('../../src/response')
const path = require('path');
const fs = require('fs');
const Logs = require('../../src/logs')
const Logger = new Logs()
class DirectoryTree extends Service {
    renameDirectoryOrFile(options) {
        return new Promise((reslove, reject) => {
            try{
                fs.renameSync(`..${options.oldPath}`, `..${options.newPath}`)
                Logger.log(this.ctx, `重命名：..${options.oldPath} 改为：..${options.newPath}`)
                reslove(new Response({code: 1, msg: '重命名成功', data : ''}))
            }catch(e) {
                reslove(new Response({code: -1, msg: '重命名失败', data : ''}))
            }
        })
    }
    createNewDirectory(options) {
        return new Promise((reslove, reject) => {
            try{
                fs.mkdirSync(`..${options.fullPath}`)
                Logger.log(this.ctx, `创建文件：..${options.fullPath}`)
                reslove(new Response({code: 1, msg: '创建目录成功', data : ''}))
            }catch(e) {
                reslove(new Response({code: -1, msg: '创建目录失败', data : ''}))
            }
        })
    }
    checkFileOrDirectory(fullPath) {
        return new Promise((reslove, reject) => {
            fs.stat(fullPath, (err, stats) => {
                if(err) {
                    throw new Error('读取文件失败')
                }
                if (stats.isDirectory()) {
                    reslove(1)
                } else {
                    reslove(0)
                }
            })
        })
    }
    /**
     * 删除文件夹下所有问价及将文件夹下所有文件清空
     * @param {*} path 
     */
    emptyDir(path) {
        const files = fs.readdirSync(path);
        files.forEach(file => {
            const filePath = `${path}/${file}`;
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                this.emptyDir(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        });
    }
    /**
     * 删除指定路径下的所有空文件夹
     * @param {*} path 
     */
    rmEmptyDir(path, level=0) {
        const files = fs.readdirSync(path);
        if (files.length > 0) {
            let tempFile = 0;
            files.forEach(file => {
                tempFile++;
                this.rmEmptyDir(`${path}/${file}`, 1);
            });
            if (tempFile === files.length && level !== 0) {
                fs.rmdirSync(path);
            }
        }
        else {
            level !==0 && fs.rmdirSync(path);
        }
    }
    /**
     * 清空指定路径下的所有文件及文件夹
     * @param {*} path 
     */
    clearDir(path) {
        this.emptyDir(path);
        this.rmEmptyDir(path, 1);
    }
    deleteFileOrDirectory(deleteList) {
        return new Promise((reslove, reject) => {
            deleteList.forEach((options) => {
                if(options.type === 0) {
                    Logger.log(this.ctx, `删除文件：..${options.fullPath}`)
                    fs.unlinkSync(`..${options.fullPath}`);
                }
            })
            deleteList.forEach((options) => {
                if(options.type === 1) {
                    Logger.log(this.ctx, `删除文件：..${options.fullPath}`)
                    this.clearDir(`..${options.fullPath}`)
                }
            })
            reslove(new Response({code: 1, msg: '删除成功', data : ''}))
        })
    }
    uploadFileToTargetDirec(options) {
        return new Promise((reslove, reject) => {
            try {
                let file = options.files[0]
                Logger.log(this.ctx, `上传文件：..${options.body.target}/${file.filename}`)
                let wfile = fs.readFileSync(file.filepath)
                fs.writeFileSync(`..${options.body.target}/${file.filename}`, wfile)
                reslove(new Response({code: 1, msg: '上传成功', data : ''}))
            } catch (err) {
                reslove(new Response({code: -1, msg: '上传失败', data : ''}))
            }
        })
    }
    readDirRecur(folder, callback, container) {
        fs.readdir(folder, (err, files) => {
            var count = 0
            var checkEnd = () => {
                ++count == files.length && callback()
            }
            files.forEach((name) => {
                var fullPath = folder + '/' + name;
                fs.stat(fullPath, (err, stats) => {
                    if(err) {
                        throw new Error('读取文件失败')
                    }
                    if (stats.isDirectory()) {
                        container[name] = []
                        return this.readDirRecur(fullPath, checkEnd, container[name]);
                    } else {
                        // 为1读取所有文件和文件夹，为0只读取文件夹
                        container.push(name)
                        /*not use ignore files*/
                        // if(name[0] == '.') {
                        // }
                        checkEnd()
                    }
                })
            })
            //为空时直接回调
            files.length === 0 && callback()
        })
    }
    async transferTree(fileList, callback, transferLista, path, filed) {
        var count = 0
        var checkEnd = () => {
            ++count == fileList.length && callback()
        }
        for(let i in fileList) {
            if(fileList[i] instanceof Array) {
                transferLista.push({
                    id: `${path}/${i}`,
                    name: i,
                    type: 1,
                    fullPath: `${path}/${i}`,
                    children: []
                })
                this.transferTree(fileList[i], callback, transferLista[transferLista.length -1].children, `${path}/${i}`, filed)
            } else {
                // console.log(transferList)
                if(filed == 1) {
                    transferLista.push({
                        id: `${path}/${fileList[i]}`,
                        name: fileList[i],
                        type: 0,
                        fullPath: `${path}/${fileList[i]}`
                    })
                }
                checkEnd()
            }
        }
    }
    async getDirectoryOrFile(options) {
        this.fileList  = []
        this.transferList = [{
            name: 'mc',
            fullPath: '/mc',
            id: '/mc',
            type: 1,
            children: []
        }]
        return new Promise((reslove,reject) => {
            this.readDirRecur(path.resolve(__dirname, '../../../mc/'), (filePath) => {
                // console.log(this.fileList)
                this.transferTree(this.fileList, () => {
                    reslove(this.transferList)
                    // console.log(transferList)
                }, this.transferList[0].children, '/mc', options.filed)
                // this.fileList.forEach(item => {
                //     console.log(item)
                // })
            }, this.fileList)
            // await this.walk(, (filePath, stat) => {
            //     console.log(filePath)
            //     return new Response({code: 1, msg: '更新游戏配置成功', data: ''})
            // });
        })
    }
}
module.exports = DirectoryTree;
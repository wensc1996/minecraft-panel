const Service = require('egg').Service;
const Response = require('../../src/response')
const path = require('path');
const fs = require('fs');
class DirectoryTree extends Service {
    uploadFileToTargetDirec(options) {
        return new Promise((reslove, reject) => {
            try {
                let file = options.files[0]
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
                var fullPath = folder + '\\' + name;
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
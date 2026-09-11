const Service = require('egg').Service;
const Response = require('../../src/response')
const path = require('path');
const fs = require('fs');
const Logs = require('../../src/logger')
const Logger = new Logs()
const db = require('../../src/mysql/connection')
const { buildWorkPath } = require('../../src/instancePath')

// 校验路径是否落在实例工作目录内，防止目录穿越
function withinRoot(fullPath, root) {
    const rp = path.resolve(fullPath);
    const rr = path.resolve(root);
    return rp === rr || rp.startsWith(rr + path.sep);
}

class DirectoryTree extends Service {
    // 取实例工作目录（校验实例归属当前租户）：工作目录 = 租户 storage_path + 实例 name（不落库）
    async getWorkPath(instanceId) {
        const tenantId = this.ctx.tenantId;
        const rows = await db.query(
            'select d.name, d.tenant_id, t.storage_path from dispose d left join tenant t on t.tenant_id = d.tenant_id where d.instance_id = ?',
            [Number(instanceId)]
        );
        if (!rows || !rows.length) throw new Error('实例不存在');
        if (rows[0].tenant_id !== tenantId) throw new Error('无权访问该实例');
        if (!rows[0].storage_path) throw new Error('租户存储目录未配置');
        return buildWorkPath(rows[0].storage_path, rows[0].name);
    }
    // 取租户存储根目录（文件管理顶级入口，根=storage_path）
    async getTenantRoot() {
        const tenantId = this.ctx.tenantId;
        const rows = await db.query('select storage_path from tenant where tenant_id = ?', [tenantId]);
        if (!rows || !rows.length || !rows[0].storage_path) throw new Error('租户存储目录未配置');
        return rows[0].storage_path;
    }
    // 解析文件操作根目录：传 instanceId 用实例工作目录，否则用租户存储根目录
    async resolveRoot(options) {
        if (options && options.instanceId) return this.getWorkPath(options.instanceId);
        return this.getTenantRoot();
    }
    renameDirectoryOrFile(options) {
        return new Promise(async (reslove) => {
            try {
                const root = await this.resolveRoot(options);
                if (!withinRoot(options.oldPath, root) || !withinRoot(options.newPath, root)) {
                    return reslove(new Response({ code: -1, msg: '路径越权', data: '' }));
                }
                fs.renameSync(options.oldPath, options.newPath);
                Logger.log(this.ctx, `重命名：${options.oldPath} 改为：${options.newPath}`);
                reslove(new Response({ code: 0, msg: '重命名成功', data: '' }));
            } catch (e) {
                reslove(new Response({ code: -1, msg: '重命名失败：' + e.message, data: '' }));
            }
        });
    }
    createNewDirectory(options) {
        return new Promise(async (reslove) => {
            try {
                const root = await this.resolveRoot(options);
                if (!withinRoot(options.fullPath, root)) {
                    return reslove(new Response({ code: -1, msg: '路径越权', data: '' }));
                }
                fs.mkdirSync(options.fullPath);
                Logger.log(this.ctx, `创建文件：${options.fullPath}`);
                reslove(new Response({ code: 0, msg: '创建目录成功', data: '' }));
            } catch (e) {
                reslove(new Response({ code: -1, msg: '创建目录失败：' + e.message, data: '' }));
            }
        });
    }
    checkFileOrDirectory(fullPath) {
        return new Promise((reslove, reject) => {
            fs.stat(fullPath, (err, stats) => {
                if (err) {
                    throw new Error('读取文件失败');
                }
                if (stats.isDirectory()) {
                    reslove(1);
                } else {
                    reslove(0);
                }
            });
        });
    }
    emptyDir(originPath) {
        const files = fs.readdirSync(originPath);
        files.forEach(file => {
            const filePath = path.join(originPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                this.emptyDir(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        });
    }
    rmEmptyDir(originPath, level = 0) {
        const files = fs.readdirSync(originPath);
        if (files.length > 0) {
            let tempFile = 0;
            files.forEach(file => {
                tempFile++;
                this.rmEmptyDir(path.join(originPath, file), 1);
            });
            if (tempFile === files.length && level !== 0) {
                fs.rmdirSync(originPath);
            }
        }
        else {
            level !== 0 && fs.rmdirSync(originPath);
        }
    }
    clearDir(originPath) {
        this.emptyDir(originPath);
        this.rmEmptyDir(originPath, 1);
    }
    deleteFileOrDirectory(options) {
        return new Promise(async (reslove) => {
            try {
                const list = options.list || options;
                const root = await this.resolveRoot(options);
                list.forEach((o) => {
                    if (!withinRoot(o.fullPath, root)) throw new Error('路径越权: ' + o.fullPath);
                });
                list.forEach((o) => {
                    if (o.type === 0) {
                        Logger.log(this.ctx, `删除文件：${o.fullPath}`);
                        fs.unlinkSync(o.fullPath);
                    }
                });
                list.forEach((o) => {
                    if (o.type === 1) {
                        Logger.log(this.ctx, `删除目录：${o.fullPath}`);
                        this.clearDir(o.fullPath);
                    }
                });
                reslove(new Response({ code: 0, msg: '删除成功', data: '' }));
            } catch (e) {
                reslove(new Response({ code: -1, msg: '删除失败：' + e.message, data: '' }));
            }
        });
    }
    uploadFileToTargetDirec(options) {
        return new Promise(async (reslove) => {
            try {
                const root = await this.resolveRoot(options.body);
                const target = options.body.target;
                if (!withinRoot(target, root)) {
                    return reslove(new Response({ code: -1, msg: '路径越权', data: '' }));
                }
                let file = options.files[0];
                Logger.log(this.ctx, `上传文件：..${path.join(target, file.filename)}`);
                let wfile = fs.readFileSync(file.filepath);
                fs.writeFileSync(path.join(target, file.filename), wfile);
                reslove(new Response({ code: 0, msg: '上传成功', data: '' }));
            } catch (err) {
                reslove(new Response({ code: -1, msg: '上传失败：' + err.message, data: '' }));
            }
        });
    }
    readDirRecur(folder, callback, container) {
        fs.readdir(folder, (err, files) => {
            var count = 0;
            var checkEnd = () => {
                ++count == files.length && callback();
            };
            files.forEach((name) => {
                var fullPath = path.join(folder, name);
                fs.stat(fullPath, (err, stats) => {
                    if (err) {
                        // 无权限/损坏的符号链接等：跳过该条目，但仍计入完成计数，避免读取挂死
                        checkEnd();
                        return;
                    }
                    if (stats.isDirectory()) {
                        container[name] = [];
                        return this.readDirRecur(fullPath, checkEnd, container[name]);
                    } else {
                        container.push(name);
                        checkEnd();
                    }
                });
            });
            files.length === 0 && callback();
        });
    }
    async transferTree(fileList, callback, transferLista, workPath, filed) {
        const keys = Object.keys(fileList);
        // 空目录（含空子目录）时循环体不执行，必须在此直接回调，否则 Promise 永不 resolve
        if (keys.length === 0) {
            callback();
            return;
        }
        let count = 0;
        // 完成计数要按“全部条目（目录 + 文件）”算，不能用 fileList.length（那只算文件），
        // 否则目录属性还未遍历就提前 resolve，导致响应里整棵目录树缺失
        const checkEnd = () => {
            if (++count === keys.length) callback();
        };
        for (const i of keys) {
            const item = fileList[i];
            if (item instanceof Array) {
                const node = {
                    id: path.join(workPath, i),
                    name: i,
                    type: 1,
                    fullPath: path.join(workPath, i),
                    children: []
                };
                transferLista.push(node);
                this.transferTree(item, checkEnd, node.children, path.join(workPath, i), filed);
            } else {
                if (filed == 1) {
                    transferLista.push({
                        id: path.join(workPath, item),
                        name: item,
                        type: 0,
                        fullPath: path.join(workPath, item)
                    });
                }
                checkEnd();
            }
        }
    }
    async getDirectoryOrFile(options) {
        let root;
        try {
            root = await this.resolveRoot(options);
        } catch (e) {
            return new Response({ code: -1, msg: e.message, data: '' });
        }
        this.fileList = [];
        this.transferList = [{
            name: path.basename(root),
            fullPath: root,
            id: root,
            type: 1,
            children: []
        }];
        let directoryTree = await new Promise((reslove) => {
            this.readDirRecur(root, () => {
                this.transferTree(this.fileList, () => {
                    reslove(this.transferList);
                }, this.transferList[0].children, root, options.filed);
            }, this.fileList);
        });
        return new Response({ code: 0, msg: '获取成功', data: directoryTree });
    }
}
module.exports = DirectoryTree;

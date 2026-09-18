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
                const socketId = options.socketId;
                const root = await this.resolveRoot(options);
                list.forEach((o) => {
                    if (!withinRoot(o.fullPath, root)) throw new Error('路径越权: ' + o.fullPath);
                });

                // 统计待删除条目总数（文件+目录）用于进度；跳过符号链接避免误删目标
                const files = [];
                const dirs = [];
                let total = 0;
                const collect = (p) => {
                    let st;
                    try { st = fs.lstatSync(p); } catch (e) { return; }
                    if (st.isSymbolicLink()) return;
                    if (st.isDirectory()) {
                        dirs.push(p);
                        total++;
                        let names = [];
                        try { names = fs.readdirSync(p); } catch (e) { return; }
                        for (const n of names) collect(path.join(p, n));
                    } else if (st.isFile()) {
                        files.push(p);
                        total++;
                    }
                };
                for (const o of list) collect(o.fullPath);
                if (total === 0) total = list.length;

                let done = 0;
                let lastPct = -1;
                const emit = (msg) => {
                    if (!socketId || !this.ctx || !this.ctx.app || !this.ctx.app.io) return;
                    const pct = Math.floor((done / total) * 100);
                    if (pct === lastPct && !msg) return;
                    lastPct = pct;
                    try {
                        this.ctx.app.io.of('/').to(socketId).emit('wensc', {
                            type: 'deleteProgress',
                            data: { done, total, msg: msg || '' }
                        });
                    } catch (e) {}
                };
                const flush = () => new Promise((r) => setImmediate(r));

                // 先删文件
                for (const f of files) {
                    try { fs.unlinkSync(f); } catch (e) { Logger.log(this.ctx, `删除文件失败(跳过): ${f} ${e.message}`); }
                    done++;
                    if (done % 200 === 0) { emit(); await flush(); }
                }
                // 再删目录（从深到浅），确保父目录清空后再删
                dirs.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);
                for (const d of dirs) {
                    try { fs.rmdirSync(d); } catch (e) { Logger.log(this.ctx, `删除目录失败(跳过): ${d} ${e.message}`); }
                    done++;
                    if (done % 200 === 0) { emit(); await flush(); }
                }
                emit('done');
                reslove(new Response({ code: 0, msg: '删除成功', data: '' }));
            } catch (e) {
                reslove(new Response({ code: -1, msg: '删除失败：' + e.message, data: '' }));
            }
        });
    }
    // 将勾选的多个文件/目录打包为 zip，通过 archiver 流式压缩并直接 pipe 到响应（失败返回 Response）
    // 相比 adm-zip 的 compressToBuffer（整包进内存），流式压缩不受内存限制，可打包任意大目录。
    async packageDownload(options) {
        return new Promise(async (resolve) => {
            try {
                const list = options.list || [];
                const socketId = options.socketId;
                if (!list.length) return resolve(new Response({ code: -1, msg: '未选择任何文件或目录' }));
                const root = await this.resolveRoot(options);
                const archiver = require('archiver');
                const { PassThrough } = require('stream');
                const pass = new PassThrough();
                const archive = archiver('zip', { zlib: { level: 6 } });
                archive.pipe(pass);

                // 下载进度：自行统计每个文件实际读取的（未压缩）字节数，通过 socket 推送到前端
                let totalBytes = 0;
                let processedBytes = 0;
                let lastDlPct = -1;
                const emitDownload = (force) => {
                    if (!socketId || !this.ctx || !this.ctx.app || !this.ctx.app.io) return;
                    const total = totalBytes;
                    const pct = total ? Math.floor((processedBytes / total) * 100) : 0;
                    if (pct === lastDlPct && !force) return;
                    lastDlPct = pct;
                    try {
                        this.ctx.app.io.of('/').to(socketId).emit('wensc', {
                            type: 'downloadProgress',
                            data: { done: processedBytes, total }
                        });
                    } catch (e) {}
                };
                // 包装文件读取流，按实际读取字节累计进度（未压缩字节，与 totalBytes 同口径）
                const countingStream = (fullPath) => {
                    const rs = fs.createReadStream(fullPath);
                    rs.on('data', (chunk) => { processedBytes += chunk.length; emitDownload(false); });
                    return rs;
                };

                const selected = list.map(item => item.fullPath);
                let appended = 0;
                // 递归收集条目并交给 archiver 流式压缩；跳过符号链接防止递归死循环
                const walk = (fullPath, rel) => {
                    let st;
                    try { st = fs.lstatSync(fullPath); } catch (e) { return; }
                    if (st.isSymbolicLink()) return; // 不跟随符号链接
                    if (st.isDirectory()) {
                        let names = [];
                        try { names = fs.readdirSync(fullPath); } catch (e) { return; }
                        if (names.length === 0 && rel) {
                            // 空目录写入占位条目，保留目录结构
                            archive.append(Buffer.alloc(0), { name: rel + '/' });
                            appended++;
                            return;
                        }
                        for (const n of names) {
                            const childRel = rel ? rel + '/' + n : n;
                            walk(path.join(fullPath, n), childRel);
                        }
                    } else if (st.isFile()) {
                        const entryName = rel || path.basename(fullPath);
                        archive.append(countingStream(fullPath), { name: entryName });
                        totalBytes += st.size;
                        appended++;
                    }
                };

                for (const item of list) {
                    const fullPath = item.fullPath;
                    if (!withinRoot(fullPath, root)) throw new Error('路径越权: ' + fullPath);
                    let st;
                    try { st = fs.lstatSync(fullPath); } catch (e) { continue; }
                    if (st.isSymbolicLink()) continue;
                    // 本项已被其它已选项（目录）包含则跳过，避免重复打包
                    const contained = selected.some(other => other !== fullPath && (fullPath === other || fullPath.startsWith(other + path.sep)));
                    if (contained) continue;
                    const rel = path.relative(root, fullPath).split(path.sep).join('/');
                    if (st.isDirectory()) {
                        walk(fullPath, rel === '' ? '' : rel);
                    } else {
                        archive.append(countingStream(fullPath), { name: rel || path.basename(fullPath) });
                        appended++;
                    }
                }

                if (appended === 0) {
                    archive.abort();
                    pass.destroy();
                    return resolve(new Response({ code: -1, msg: '未找到可打包的文件（可能均为符号链接或已不存在）' }));
                }

                archive.finalize().then(() => {
                    emitDownload(true); // 收尾推送 100%
                }).catch(() => {});
                archive.on('error', (err) => { pass.destroy(err); });
                resolve({ stream: pass });
            } catch (e) {
                resolve(new Response({ code: -1, msg: e.message }));
            }
        });
    }
    // 解压 zip 到同级目录（以 zip 文件名命名的文件夹，避免覆盖已有目录），通过 socket 推送解压进度；含 zip 目录穿越防护
    extractZip(options) {
        return new Promise(async (resolve) => {
            try {
                const root = await this.resolveRoot(options);
                const zipPath = options.target;
                if (!withinRoot(zipPath, root)) {
                    return resolve(new Response({ code: -1, msg: '路径越权', data: '' }));
                }
                if (!/\.zip$/i.test(zipPath)) {
                    return resolve(new Response({ code: -1, msg: '仅支持 .zip 压缩包解压', data: '' }));
                }
                const AdmZip = require('adm-zip');
                let zip;
                try { zip = new AdmZip(zipPath); } catch (e) {
                    return resolve(new Response({ code: -1, msg: '压缩包读取失败：' + e.message, data: '' }));
                }
                const entries = zip.getEntries();
                if (!entries.length) {
                    return resolve(new Response({ code: -1, msg: '压缩包为空', data: '' }));
                }
                const dir = path.dirname(zipPath);
                const base = path.basename(zipPath, path.extname(zipPath));
                let destDir = path.join(dir, base);
                let idx = 1;
                while (fs.existsSync(destDir)) {
                    destDir = path.join(dir, base + '_' + idx);
                    idx++;
                }
                if (!withinRoot(destDir, root)) {
                    return resolve(new Response({ code: -1, msg: '解压目标路径越权', data: '' }));
                }
                // zip 目录穿越防护：逐个校验条目解压后不逃逸出根目录
                for (const entry of entries) {
                    const target = path.join(destDir, entry.entryName);
                    if (!withinRoot(target, root)) {
                        return resolve(new Response({ code: -1, msg: '压缩包内含越权路径，已中止：' + entry.entryName, data: '' }));
                    }
                }
                fs.mkdirSync(destDir, { recursive: true });
                const socketId = options.socketId;
                const total = entries.length;
                let done = 0;
                let lastPct = -1;
                const emit = (msg) => {
                    if (!socketId || !this.ctx || !this.ctx.app || !this.ctx.app.io) return;
                    const pct = Math.floor((done / total) * 100);
                    if (pct === lastPct && !msg) return;
                    lastPct = pct;
                    try {
                        this.ctx.app.io.of('/').to(socketId).emit('wensc', {
                            type: 'extractProgress',
                            data: { done, total, msg: msg || '' }
                        });
                    } catch (e) {}
                };
                const flush = () => new Promise((r) => setImmediate(r));
                for (const entry of entries) {
                    try {
                        zip.extractEntryTo(entry, destDir, true, true); // 保留条目内部路径，覆盖已存在
                    } catch (e) {
                        Logger.log(this.ctx, `解压条目失败(跳过): ${entry.entryName} ${e.message}`);
                    }
                    done++;
                    if (done % 200 === 0) { emit(); await flush(); }
                }
                emit('done');
                Logger.log(this.ctx, `解压文件：${zipPath} -> ${destDir}`);
                resolve(new Response({ code: 0, msg: '解压成功', data: { destDir } }));
            } catch (e) {
                resolve(new Response({ code: -1, msg: '解压失败：' + e.message, data: '' }));
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
            // 读取目录失败（路径不存在/权限不足/失效符号链接等）：files 为 undefined，
            // 直接结束该分支并回调父级计数，避免 files.forEach 崩溃与父级 Promise 挂死
            if (err) { return callback(); }
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

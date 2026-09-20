'use strict';

const Controller = require('egg').Controller;
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const Response = require('../../src/response');

function withinRoot(fullPath, root) {
    const rp = path.resolve(fullPath);
    const rr = path.resolve(root);
    return rp === rr || rp.startsWith(rr + path.sep);
}

class DirectoryTree extends Controller {
    async getDirectoryOrFile() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.getDirectoryOrFile(ctx.request.body);
    }
    async download() {
        const { ctx } = this;
        const filePath = ctx.request.query.target;
        const instanceId = ctx.request.query.instanceId;
        try {
            const root = await this.ctx.service.directoryTree.resolveRoot({ instanceId });
            if (!withinRoot(filePath, root)) {
                ctx.body = new Response({ code: -1, msg: '路径越权' });
                return;
            }
            const fileSize = (await promisify(fs.stat)(filePath)).size.toString();
            ctx.attachment(filePath);
            ctx.set('Content-Length', fileSize);
            ctx.set('Content-Type', 'application/octet-stream');
            ctx.body = fs.createReadStream(filePath);
        } catch (e) {
            ctx.body = new Response({ code: -1, msg: e.message });
        }
    }
    async uploadFileToTargetDirec() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.uploadFileToTargetDirec(ctx.request);
    }
    async deleteFileOrDirectory() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.deleteFileOrDirectory(ctx.request.body);
    }
    async createNewDirectory() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.createNewDirectory(ctx.request.body);
    }
    async renameDirectoryOrFile() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.renameDirectoryOrFile(ctx.request.body);
    }
    async extractZip() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.extractZip(ctx.request.body);
    }
    async readFile() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.readFile(ctx.request.body);
    }
    async writeFile() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.writeFile(ctx.request.body);
    }
    async packageDownload() {
        const { ctx } = this;
        const result = await this.ctx.service.directoryTree.packageDownload(ctx.request.body);
        if (!result || !result.stream) {
            ctx.body = result; // 业务错误：Response 对象
            return;
        }
        try {
            // archiver 已流式压缩，直接把可读流作为响应体；不预设 Content-Length（分块传输）
            ctx.attachment(`mcpanel-download-${Date.now()}.zip`);
            ctx.set('Content-Type', 'application/zip');
            ctx.body = result.stream;
        } catch (e) {
            ctx.body = new Response({ code: -1, msg: '打包下载失败：' + e.message });
        }
    }
}

module.exports = DirectoryTree;

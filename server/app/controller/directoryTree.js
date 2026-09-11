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
}

module.exports = DirectoryTree;

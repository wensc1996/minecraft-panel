'use strict';

const Controller = require('egg').Controller;
const fs = require('fs');
const { promisify } = require("util");
class DirectoryTree extends Controller {
    async getDirectoryOrFile() {
        const { ctx } = this
        ctx.body = await this.ctx.service.directoryTree.getDirectoryOrFile(ctx.request.body)
    }
    async download() {
        const { ctx } = this
        const filePath = ctx.request.query.target
        let fileSize = (await promisify(fs.stat)(filePath)).size.toString();
        ctx.attachment(filePath)
        ctx.set('Content-Length', fileSize)
        ctx.set('Content-Type', 'application/octet-stream')
        ctx.body = fs.createReadStream(filePath)
    }
    async uploadFileToTargetDirec() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.uploadFileToTargetDirec(ctx.request)
    }
    async deleteFileOrDirectory() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.deleteFileOrDirectory(ctx.request.body)
    }
    async createNewDirectory() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.createNewDirectory(ctx.request.body)
    }
    async renameDirectoryOrFile() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.directoryTree.renameDirectoryOrFile(ctx.request.body)
    }
}

module.exports = DirectoryTree;
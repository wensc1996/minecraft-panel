'use strict';

const Controller = require('egg').Controller;
const fs = require('fs');
const { promisify } = require("util");
class DirectoryTree extends Controller {
    async getDirectoryOrFile() {
        const { ctx } = this
        ctx.body = await this.ctx.service.directoryTree.getDirectoryOrFile()
    }
    async download() {
        const { ctx } = this
        const filePath = '../mc/achievements.log'
        let fileSize = (await promisify(fs.stat)(filePath)).size.toString();
        ctx.attachment(filePath)
        ctx.set('Content-Length', fileSize)
        ctx.set('Content-Type', 'application/octet-stream')
        ctx.body = fs.createReadStream(filePath)
    }
}

module.exports = DirectoryTree;
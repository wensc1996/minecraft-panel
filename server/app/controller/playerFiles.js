'use strict';

const Controller = require('egg').Controller;

class PlayerFiles extends Controller {
    async backupPlayer() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.playerFiles.backupPlayer(ctx.request.body);
    }
    async restorePlayer() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.playerFiles.restorePlayer(ctx.request.body);
    }
    async uploadFile() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.playerFiles.uploadFile(ctx.request)
    }
}
module.exports = PlayerFiles;

'use strict';

const Controller = require('egg').Controller;

class DisposeController extends Controller {
    async getGameDispose() {
        const { ctx } = this
        ctx.request.body.ip = ctx.request.ip
        ctx.body = await this.ctx.service.dispose.getGameDispose()
    }
    async updateGameDispose() {
        const { ctx } = this
        ctx.request.body.ip = ctx.request.ip
        ctx.body = await this.ctx.service.dispose.updateGameDispose(ctx.request.body)
    }
}

module.exports = DisposeController;

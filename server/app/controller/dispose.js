'use strict';

const Controller = require('egg').Controller;

class DisposeController extends Controller {
    async getGameDispose() {
        const { ctx } = this
        ctx.body = await this.ctx.service.dispose.getGameDispose(ctx.request.body)
    }
    async updateGameDispose() {
        const { ctx } = this
        ctx.body = await this.ctx.service.dispose.updateGameDispose(ctx.request.body)
    }
    async getInstanceList() {
        const { ctx } = this
        ctx.body = await this.ctx.service.dispose.getServerInstances()
    }
    async addInstance() {
        const { ctx } = this
        ctx.body = await this.ctx.service.dispose.addInstance(ctx.request.body)
    }
    async deleteInstance() {
        const { ctx } = this
        ctx.body = await this.ctx.service.dispose.deleteInstance(ctx.request.body)
    }
    async getDisposeHistoryList() {
        const { ctx } = this
        ctx.body = await this.ctx.service.dispose.getDisposeHistoryList(ctx.request.body)
    }
    async getDisposeHistoryDetail() {
        const { ctx } = this
        ctx.body = await this.ctx.service.dispose.getDisposeHistoryDetail(ctx.request.body)
    }
    async deleteDisposeHistory() {
        const { ctx } = this
        ctx.body = await this.ctx.service.dispose.deleteDisposeHistory(ctx.request.body)
    }
}

module.exports = DisposeController;

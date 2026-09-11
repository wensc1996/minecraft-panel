'use strict';

const Controller = require('egg').Controller;

class DictController extends Controller {
    async listDict() {
        const { ctx } = this
        ctx.body = await ctx.service.dict.listDict(ctx.request.body)
    }
    async addDict() {
        const { ctx } = this
        ctx.body = await ctx.service.dict.addDict(ctx.request.body)
    }
    async updateDict() {
        const { ctx } = this
        ctx.body = await ctx.service.dict.updateDict(ctx.request.body)
    }
    async deleteDict() {
        const { ctx } = this
        ctx.body = await ctx.service.dict.deleteDict(ctx.request.body)
    }
}
module.exports = DictController;

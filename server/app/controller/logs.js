'use strict';

const Controller = require('egg').Controller;

class LogsController extends Controller {
    async getLogList() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.logs.getLogList(ctx.request.body);
    }
    async deleteLog(){
        const { ctx } = this;
        ctx.request.body.createTime = this.now()
        ctx.body = await this.ctx.service.logs.deleteLog(ctx.request.body);
    }
}

module.exports = LogsController;

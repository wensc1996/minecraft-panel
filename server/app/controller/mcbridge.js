'use strict';

const Controller = require('egg').Controller;

class mcBridgeController extends Controller {
    async getBridgeMessage() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.mcbridge.get(ctx.request.body);
    }
}

module.exports = mcBridgeController;

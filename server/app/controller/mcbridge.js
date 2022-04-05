'use strict';

const Controller = require('egg').Controller;

class mcBridgeController extends Controller {
    async killProcess() {
        const { ctx } = this;
        ctx.body = ctx.io.controller.mcbridge.killProcess(ctx.request.body);
    }
    async beginProcess() {
        const { ctx } = this;
        ctx.body = ctx.io.controller.mcbridge.beginProcess(ctx.request.body);
    }
}
module.exports = mcBridgeController;

'use strict';

const Controller = require('egg').Controller;

class LoginController extends Controller {
    async login() {
        const { ctx } = this;
        ctx.request.body.ip = ctx.request.ip
        ctx.body = await this.ctx.service.login.find(ctx.request.body);
    }
    logout() {
        const { ctx } = this;
        ctx.body = this.ctx.service.login.logout(ctx.request.body);
    }
}

module.exports = LoginController;

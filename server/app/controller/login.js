'use strict';

const Controller = require('egg').Controller;

class LoginController extends Controller {
    async index() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.login.find(ctx.request.body);
    }
}

module.exports = LoginController;

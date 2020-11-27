'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
    async getUserList() {
        const { ctx } = this;
        console.log(ctx.request.ip)
        ctx.body = await this.ctx.service.user.getUserList(ctx.request.body);
    }
    async updatePassword() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.user.updatePassword(ctx.request.body);
    }
    async deleteUser() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.user.deleteUser(ctx.request.body);
    }
    async addNewUser() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.user.addNewUser(ctx.request.body);
    }
}

module.exports = UserController;

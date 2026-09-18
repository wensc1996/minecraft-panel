'use strict';

const Controller = require('egg').Controller;

class privilegeController extends Controller {
    async getRolePrivilege() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.privilege.getRolePrivilege(ctx.request.body);
    }
    async getRoleList() {
        const { ctx }  = this
        ctx.body = await this.ctx.service.privilege.getRoleList()
    }
    async getPrivilegeList() {
        const { ctx }  = this
        ctx.body = await this.ctx.service.privilege.getPrivilegeList()
    }
    async updatePrivilege() {
        const { ctx } = this
        ctx.body = await this.ctx.service.privilege.updatePrivilege(ctx.request.body)
    }
    async createRole() {
        const { ctx } = this
        ctx.body = await this.ctx.service.privilege.createRole(ctx.request.body)
    }
    async deleteRole() {
        const { ctx } = this
        ctx.body = await this.ctx.service.privilege.deleteRole(ctx.request.body)
    }
}
module.exports = privilegeController;

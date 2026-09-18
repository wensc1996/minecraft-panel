const Controller = require('egg').Controller;

class TenantController extends Controller {
    async getTenantList() {
        const { ctx } = this
        ctx.body = await this.ctx.service.tenant.getTenantList()
    }
    async getDashboard() {
        const { ctx } = this
        ctx.body = await this.ctx.service.tenant.getDashboard()
    }
    async updateTenantStatus() {
        const { ctx } = this
        ctx.body = await this.ctx.service.tenant.updateTenantStatus(ctx.request.body)
    }
    async switchTenant() {
        const { ctx } = this
        ctx.body = await this.ctx.service.tenant.switchTenant(ctx.request.body)
    }
    async addTenant() {
        const { ctx } = this
        ctx.body = await this.ctx.service.tenant.addTenant(ctx.request.body)
    }
    async updateTenant() {
        const { ctx } = this
        ctx.body = await this.ctx.service.tenant.updateTenant(ctx.request.body)
    }
}

module.exports = TenantController;

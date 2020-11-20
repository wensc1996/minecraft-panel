'use strict';

const Controller = require('egg').Controller;

class LocationController extends Controller {
    async getLocationList() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.location.getLocationList(ctx.request.body);
    }
    async addLocation(){
        const { ctx } = this;
        ctx.request.body.userId = '1001' // 调取session
        ctx.request.body.createTime = new Date()
        ctx.body = await this.ctx.service.location.addLocation(ctx.request.body);
    }
    async deleteLocation(){
        const { ctx } = this;
        ctx.request.body.userId = '1001' // 调取session
        ctx.request.body.createTime = new Date()
        ctx.body = await this.ctx.service.location.deleteLocation(ctx.request.body);
    }
}

module.exports = LocationController;

'use strict';

const Controller = require('egg').Controller;

class LocationController extends Controller {
    now(){
        let date = new Date();
        let Y = date.getFullYear();
        let M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1);
        let D = date.getDate()<10 ? '0'+date.getDate() : date.getDate();
        let H = date.getHours()<10 ? '0'+date.getHours() : date.getHours();
        let m = date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes();
        let s = date.getSeconds()< 10 ? '0'+date.getSeconds() : date.getSeconds();
        return (Y + '-' + M + '-' + D + ' ' + H + ':' + m + ':' + s);
    }
    async getLocationList() {
        const { ctx } = this;
        ctx.body = await this.ctx.service.location.getLocationList(ctx.request.body);
    }
    async addLocation(){
        const { ctx } = this;
        // ctx.request.body.userId = '1001' // 调取session
        ctx.request.body.createTime = this.now()
        ctx.body = await this.ctx.service.location.addLocation(ctx.request.body);
    }
    async deleteLocation(){
        const { ctx } = this;
        // ctx.request.body.userId = '1001' // 调取session
        ctx.request.body.createTime = this.now()
        ctx.body = await this.ctx.service.location.deleteLocation(ctx.request.body);
    }
}

module.exports = LocationController;

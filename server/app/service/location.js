const Service = require('egg').Service;
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')
const Logs = require('../../src/logger')
const Logger = new Logs()
class LocationService extends Service {
    // 校验实例归属当前租户，防止越权操作其他实例
    async assertInstanceOwner(instanceId) {
        const rows = await db.query('select tenant_id from dispose where instance_id = ?', [Number(instanceId)]);
        if (!rows || !rows.length || rows[0].tenant_id !== this.ctx.tenantId) {
            return new Response({ code: -403, msg: '无权操作该实例' });
        }
        return null;
    }
    async getLocationList(options) {
        const ctx = this.ctx
        // 按 用户 + 租户 + 实例 三维隔离坐标
        let res = await db.query('select * from location where user_id = ? and tenant_id = ? and instance_id = ?', [ctx.session.userId, ctx.tenantId, options.instanceId])
        if (res) {
            return new Response({ code: 0, msg: '获取坐标列表成功', data: res })
        } else {
            return new Response({ code: -1, msg: '获取坐标列表失败' })
        }
    }
    async addLocation(options) {
        const ctx = this.ctx
        const denied = await this.assertInstanceOwner(options.instanceId)
        if (denied) return denied
        let res = await db.query('insert into location (user_id, tenant_id, instance_id, coordinate, remarks, name, create_time) values (?, ?, ?, ?, ?, ?, ?)', [ctx.session.userId, ctx.tenantId, options.instanceId, options.coordinate, options.remarks, options.name, options.createTime])
        if (res) {
            Logger.log(this.ctx, `新增坐标：${[options.coordinate, options.remarks, options.name, options.createTime].join(',')}`)
            return new Response({ code: 0, msg: '新增坐标成功', data: '' })
        } else {
            return new Response({ code: -1, msg: '新增坐标失败' })
        }
    }
    async deleteLocation(options) {
        const ctx = this.ctx
        const denied = await this.assertInstanceOwner(options.instanceId)
        if (denied) return denied
        let res = await db.query('delete from location where location_id = ? and tenant_id = ? and instance_id = ?', [options.locationId, ctx.tenantId, options.instanceId])
        if (res) {
            Logger.log(this.ctx, `删除坐标：${[options.locationId].join(',')}`)
            return new Response({ code: 0, msg: '删除坐标成功', data: '' })
        } else {
            return new Response({ code: -1, msg: '删除坐标失败' })
        }
    }
}

module.exports = LocationService;

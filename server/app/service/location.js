const Service = require('egg').Service;
const Mysql = require('../../src/mysql/connection')
const Response = require('../../src/response')
const Logs = require('../../src/logger')
const Logger = new Logs()
const mysql = new Mysql()
class LocationService extends Service {
    async getLocationList(options) {
        const ctx = this.ctx
        let res = await mysql.action('select * from location where user_id = ?', ctx.session.userId)
        if(res){
            return new Response({code: 1, msg: '获取坐标列表成功', data : res})
        }else{
            return new Response({code: -1, msg: '获取坐标列表失败'})
        }
    }
    async addLocation(options){
        const ctx = this.ctx
        let res = await mysql.action('insert into location (user_id, coordinate, remarks, name, create_time) values (?, ?, ?, ?, ?)', [ctx.session.userId, options.coordinate, options.remarks, options.name, options.createTime])
        if(res){
            Logger.log(this.ctx, `新增坐标：${[options.coordinate, options.remarks, options.name, options.createTime].join(',')}`)
            return new Response({code: 1, msg: '新增坐标成功', data : ''})
        }else{
            return new Response({code: -1, msg: '新增坐标失败'})
        }
    }
    async deleteLocation(options){
        let res = await mysql.action('delete from location where location_id = ?', [options.locationId])
        if(res){
            Logger.log(this.ctx, `删除坐标：${[options.locationId].join(',')}`)
            return new Response({code: 1, msg: '删除坐标成功', data : ''})
        }else{
            return new Response({code: -1, msg: '删除坐标失败'})
        }
    }
}
  
module.exports = LocationService;
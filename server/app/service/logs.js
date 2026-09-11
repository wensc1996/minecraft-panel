const Service = require('egg').Service;
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')
class LogsService extends Service {
    async getLogList(options) {
        const ctx = this.ctx
        // 租户隔离：仅本租户日志
        let res = await db.query('select log_id, user_id, operation,date_format(op_time, "%Y-%m-%d %H:%i:%s") as op_time from logs where tenant_id = ? order by op_time desc limit ?,?', [ctx.tenantId, (options.current - 1) * options.pageSize, options.pageSize])
        let sum = await db.query('select count(*) as total from logs where tenant_id = ?', [ctx.tenantId])
        if(res){
            return new Response({code: 0, msg: '获取日志成功', data : {
                list: res,
                total: sum[0].total
            }})
        }else{
            return new Response({code: -1, msg: '获取日志失败'})
        }
    }
    async deleteLog(options){
        const ctx = this.ctx
        let res = await db.query('delete from logs where log_id = ? and tenant_id = ?', [options.logId, ctx.tenantId])
        if(res){
            return new Response({code: 0, msg: '删除日志成功', data : ''})
        }else{
            return new Response({code: -1, msg: '删除日志失败', data: ''})
        }
    }
}
  
module.exports = LogsService;

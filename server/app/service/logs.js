const Service = require('egg').Service;
const Mysql = require('../../src/mysql/connection')
const Response = require('../../src/response')
class LogsService extends Service {
    async getLogList(options) {
        let mysql = new Mysql()
        let res = await mysql.action('select log_id, user_id, operation,date_format(op_time, "%Y-%m-%d %H:%i:%s") as op_time from logs order by op_time desc limit ?,?', [(options.current - 1) * options.pageSize, options.pageSize])
        let sum = await mysql.action('select count(*) as total from logs')
        if(res){
            return new Response({code: 1, msg: '获取日志成功', data : {
                list: res,
                total: sum[0].total
            }})
        }else{
            return new Response({code: -1, msg: '获取日志失败'})
        }
    }
    async deleteLog(options){
        let mysql = new Mysql()
        let res = await mysql.action('delete from logs where log_id = ?', [options.logId])
        if(res){
            return new Response({code: 1, msg: '删除日志成功', data : ''})
        }else{
            return new Response({code: -1, msg: '删除日志失败'})
        }
    }
}
  
module.exports = LogsService;
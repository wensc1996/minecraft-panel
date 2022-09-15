const Mysql = require('../mysql/connection')
class Logs {
    constructor(){
    }
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
    log(ctx, msg) {
        let mysql = new Mysql()
        mysql.action('insert into logs (user_id, operation, op_time) values (?, ?, ?)', [ctx.session.userId, msg, this.now()])
    }
}
module.exports = Logs
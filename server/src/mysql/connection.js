
let mysqlModual = require('mysql')
class Mysql {
    constructor(){
        this.mysqlConn = ''
        this.baseInfo = {
            host : 'localhost',
            user : 'root',
            password : 'nsc9988893589',
            database : 'mcpanel'
        }
    }
    async setBaseInfo(baseInfo){
        this.baseInfo = baseInfo
    }
    async action (sql, sqlParams) {
        return new Promise((resolve, reject) => {
            this.mysqlConn = mysqlModual.createConnection(this.baseInfo)
            this.mysqlConn.connect()
            // 使用箭头函数解决this丢失问题，或者采用self = this也可以
            this.mysqlConn.query(sql, sqlParams, (error, results, fields) => {
                if (error) reject(error)
                else resolve(results)
                this.mysqlConn.end()
            })
        })
    }
}
module.exports = Mysql
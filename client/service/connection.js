// var mysql      = require('mysql');
// var connection = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'root',
//   password : 'nsc9988893589',
//   database : 'mcpanel'
// });
 


let mysqlModual = require('mysql')
class Mysql {
    constructor (host = 'localhost', user = 'root', password = 'nsc9988893589', database = 'mcpanel') {
        this.baseInfo = {
            host: host,
            user: user,
            password: password,
            database: database
        }
        this.mysqlConn = mysqlModual.createConnection(this.getBaseInfo())
        this.mysqlConn.connect()
    }
    getBaseInfo () {
        return this.baseInfo
    }
    action (sql, sqlParams) {
        return new Promise((resolve, reject) => {
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
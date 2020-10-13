let Mysql = require('./connection')
let mysql = new Mysql()
mysql.action('select * from user where user_id = ?', '1001').then((res) => {
    console.log('The solution is: ', res)
}).catch((err) => {
    console.log('Error: ', err)
})
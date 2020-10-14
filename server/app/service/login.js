const Service = require('egg').Service;
class LoginService extends Service {
    async index() {
        return {
            options: '',
            name: 'wensc',
            age: 20
        }
    }
}
  
module.exports = LoginService;
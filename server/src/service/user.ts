import { provide,inject } from 'midway';
import { IUserService, IUserOptions, IUserResponse } from '../interface/user';
import { Mysql } from '../mysql/connection'

@provide('userService')
export class UserService implements IUserService {
    @inject('mysql')
    mysql: Mysql;

    async getUser(options: IUserOptions): Promise<IUserResponse> {
        console.log(options)
        let res : any = await this.mysql.action('select * from user where user_id', options.userId)
        console.log(res[0].password, options.password)
        if(res[0].password != options.password){
            return {
                code: -1,
                msg: '密码错误',
                data: ''
            }
        }else{
            return {
                code: 0,
                msg: '登录成功',
                data: {
                    userId: options.userId,
                    playerId: 'mockedName',
                    loginIp: '12345678901',
                    role: 'xxx.xxx@xxx.com',
                    password: '123456'
                }
            }
        }
    }
}

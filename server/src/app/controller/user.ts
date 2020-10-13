import { Context, controller, post, inject, provide } from 'midway';
import { IUserService, IUserResponse } from '../../interface/user';

@provide()
@controller('/user')
export class UserController {

    @inject()
    ctx: Context;

    @inject('userService')
    service: IUserService;

    @post('/haha')
    async getUser(): Promise<void> {
        console.log(this.ctx.request.body)
        const userId: string = this.ctx.params.userId;
        const password: string = this.ctx.params.password;
        const res: IUserResponse = await this.service.getUser({ userId, password});
        this.ctx.body = res;
    }
}

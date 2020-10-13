import { Context, controller, inject, get, provide } from 'midway';

@provide()
@controller('/')
export class HomeController {

    @inject()
    ctx: Context;

    @get('/index')
    async index() {
        this.ctx.body = 'hello'
    }
}

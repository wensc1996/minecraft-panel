// {app_root}/app/io/controller/default.js
'use strict';

const Controller = require('egg').Controller;
const { exec, spawn } = require('child_process');
const java = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', __dirname.replace(/\\app\\io\\controller/, '')+'\\src\\bridge\\mine\\server.jar', 'nogui']);
let flag = false
class minecraft {
    start(){
        return new Promise((resolve, rejects)=>{
            const java = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', __dirname.replace(/\\app\\io\\controller/, '')+'\\src\\bridge\\mine\\server.jar', 'nogui']);
            var iconv = require("iconv-lite")
            java.stdin.setEncoding('utf8');
            java.stdin.write('/help\n');
            java.stdout.on('data', (data) => {
                // console.log(iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
                resolve(iconv.decode(Buffer.from(data, 'binary'), 'cp936'))
                // return new Response({code: 1, msg: '获取成功', data : iconv.decode(Buffer.from(data, 'binary'), 'cp936')})
            });
            java.stderr.on('data', (data) => {
                // console.error(`stderr: ${data}`);
                resolve(iconv.decode(Buffer.from(data, 'binary'), 'cp936'))
            });
            java.on('close', (code) => {
                return new Response({code: -1, msg: '子进程退出，退出码'})
            });
        })
    }
}
class DefaultController extends Controller {
    
    async thread() {
        const { ctx, app } = this;
        const message = ctx.args[0];
        console.log('登录了' + message)

        // let mc = new minecraft()
        // let res = await mc.start()
        // console.log(res)
        // return res

        
        var iconv = require("iconv-lite")
        java.stdin.setEncoding('utf8');
        java.stdin.write(message+'\n');
        if(flag == false){
            java.stdout.on('data', (data) => {
                // console.log(iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
                ctx.socket.emit('res', iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
                // return new Response({code: 1, msg: '获取成功', data : iconv.decode(Buffer.from(data, 'binary'), 'cp936')})
            });
            java.stderr.on('data', (data) => {
                // console.error(`stderr: ${data}`);
                ctx.socket.emit('res', iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
            });
            java.on('close', (code) => {
                console.log({code: -1, msg: '子进程退出，退出码'})
            });
            flag = true
        }
    }
}
module.exports = DefaultController;
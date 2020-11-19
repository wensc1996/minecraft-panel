// {app_root}/app/io/controller/default.js
'use strict';

const Controller = require('egg').Controller;
const { exec, spawn } = require('child_process');
const Response = require('../../../src/response')
// const java = spawn('cd', ["server/src/bridge/mine"]);
const path = require("path")
let java = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', path.join(__dirname,'../../../../mc')+'\\server.jar', 'nogui'], {cwd: path.join(__dirname,'../../../../mc')});
let flag = false
class minecraft {
    start(){
        return new Promise((resolve, rejects)=>{
            // const java = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', __dirname.replace(/\\app\\io\\controller/, '')+'\\src\\bridge\\mine\\server.jar', 'nogui']);
            var iconv = require("iconv-lite")
            java.stdin.setEncoding('utf8');
            // java.stdin.write('/help\n');
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
        const room = 'wensc'
        const { ctx, app } = this;
        ctx.socket.join(room);
        const message = ctx.args[0];
        if(message){
            var iconv = require("iconv-lite")
            java.stdin.setEncoding('utf8');
            java.stdin.write(message+'\n');
        }
        // let mc = new minecraft()
        // let res = await mc.start()
        // console.log(res)
        // return res
 
        if(flag == false){
            java.stdout.on('data', (data) => {
                // console.log(iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
                ctx.app.io.of('/').to(room).emit('wensc', iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
                // ctx.socket.emit('wensc', iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
                // return new Response({code: 1, msg: '获取成功', data : iconv.decode(Buffer.from(data, 'binary'), 'cp936')})
            });
            java.stderr.on('data', (data) => {
                // console.error(`stderr: ${data}`);
                // console.log(iconv.decode(Buffer.from(data, 'binary'), 'cp936'))
                // ctx.socket.emit('wensc', iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
                ctx.app.io.of('/').to(room).emit('wensc', iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
            });
            java.on('close', (code) => {
                console.log({code: -1, msg: '子进程退出，退出码'})
            });
            flag = true
        }
    }
    killProcess(e) {
        const { ctx, app } = this;
        java.kill('SIGKILL')
        let res = new Response({code: 1, msg: '进程关闭成功', data : ''})
        ctx.body = res
    }
    beginProcess(e){
        const { ctx, app } = this;
        java = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', path.join(__dirname,'../../../../mc')+'\\server.jar', 'nogui'], {cwd: path.join(__dirname,'../../../../mc')});
        flag = false
        let res = new Response({code: 1, msg: '进程开启成功', data : ''})
        ctx.body = res
    }
}
module.exports = DefaultController;
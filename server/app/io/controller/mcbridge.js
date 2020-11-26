// {app_root}/app/io/controller/default.js
'use strict';

const Controller = require('egg').Controller;
const { exec, spawn } = require('child_process');
const Response = require('../../../src/response')
// const java = spawn('cd', ["server/src/bridge/mine"]);
const path = require("path")
let java = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', path.join(__dirname,'../../../../mc')+'\\server.jar', 'nogui'], {cwd: path.join(__dirname,'../../../../mc')});
let flag = false
let serverStatus = true
<<<<<<< HEAD
=======
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
>>>>>>> 6bbabaffd572b3ab9a82c26389c7bcac4634d427
class DefaultController extends Controller {
    async thread() {
        const room = 'wensc'
        const { ctx, app } = this;
        ctx.socket.join(room);
        const message = ctx.args[0];
<<<<<<< HEAD
        if(message && serverStatus){
=======
        if(message){
            var iconv = require("iconv-lite")
>>>>>>> 6bbabaffd572b3ab9a82c26389c7bcac4634d427
            java.stdin.setEncoding('utf8');
            java.stdin.write(message+'\n');
        }
        // let mc = new minecraft()
        // let res = await mc.start()
        // console.log(res)
        // return res
 
        if(flag == false){
            java.stdout.on('data', (data) => {
<<<<<<< HEAD
                // console.log(data)
                // console.log();
                ctx.app.io.of('/').to(room).emit('wensc', Buffer.from(data, 'binary').toString('utf-8'));
               
            });
            java.stderr.on('data', (data) => {
                
                // console.log(iconv.decode(Buffer.from(data, 'binary'), 'cp936'))3
                // console.log(Buffer.from(data, 'binary').toString('utf-8'))
                ctx.app.io.of('/').to(room).emit('wensc', Buffer.from(data, 'binary').toString('utf-8'));
=======
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
>>>>>>> 6bbabaffd572b3ab9a82c26389c7bcac4634d427
            });
            serverStatus = true
            java.on('close', (code) => {
                serverStatus = false
                console.log({code: -1, msg: '子进程退出，退出码' + code})
            });
            flag = true
        }
    }
    serverStatus(e){
        const { ctx, app } = this;
        if(serverStatus){
            let res = new Response({code: 1, msg: '子进程在执行', data : ''})
            ctx.body = res
        }else{
            let res = new Response({code: -1, msg: '子进程已关闭', data : ''})
            ctx.body = res
        }
    }
    killProcess(e) {
        const { ctx, app } = this;
        java.kill('SIGKILL')
<<<<<<< HEAD
        serverStatus = false
=======
>>>>>>> 6bbabaffd572b3ab9a82c26389c7bcac4634d427
        let res = new Response({code: 1, msg: '进程关闭成功', data : ''})
        ctx.body = res
    }
    beginProcess(e){
        const { ctx, app } = this;
        java = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', path.join(__dirname,'../../../../mc')+'\\server.jar', 'nogui'], {cwd: path.join(__dirname,'../../../../mc')});
        flag = false
<<<<<<< HEAD
        serverStatus = true
=======
>>>>>>> 6bbabaffd572b3ab9a82c26389c7bcac4634d427
        let res = new Response({code: 1, msg: '进程开启成功', data : ''})
        ctx.body = res
    }
}
module.exports = DefaultController;
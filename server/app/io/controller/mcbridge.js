// {app_root}/app/io/controller/default.js
'use strict';

const Controller = require('egg').Controller;
const { exec, spawn } = require('child_process');
const Response = require('../../../src/response')
const iconv = require('iconv-lite');
const Mysql = require('../../../src/mysql/connection')
// const java = spawn('cd', ["server/src/bridge/mine"]);
const path = require("path");
let java = null
let flag = false
let serverStatus = true
let listFlag = false
class DefaultController extends Controller {
    async initialJava() {
        let mysql = new Mysql()
        let res = await mysql.action('select * from dispose')
        java = spawn('java', [`-Xmx${res[0].max_memory_size}M`, `-Xms${res[0].min_memory_size}M`, '-jar', path.join(__dirname,`../../../../mc/${res[0].jar_name}`), 'nogui'], {cwd: path.join(__dirname,'../../../../mc')});
        this.thread()
    }
    async thread() {
        if(!java){
           this.initialJava() 
           return
        }
        const room = 'wensc'
        const { ctx, app } = this;
        if( ctx.socket) ctx.socket.join(room);
        
        const message = ctx.args[0];
        if(message && serverStatus){
            java.stdin.setEncoding('utf8');
            java.stdin.write(message+'\n');
        }
        // let mc = new minecraft()
        // let res = await mc.start()
        // console.log(res)
        // return res
 
        if(flag == false){
            java.stdout.on('data', (data) => {
                // console.log(data)
                // console.log();
                // ctx.app.io.of('/').to(room).emit('wensc', Buffer.from(data, 'binary').toString('utf-8'));
                ctx.app.io.of('/').to(room).emit('wensc', iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
            });
            java.stderr.on('data', (data) => {
                let res = iconv.decode(Buffer.from(data, 'binary'), 'cp936')
                if(res.match(/\[INFO\]/g) && res.match(/\[INFO\]/g).length == 2){
                    res = res.replace(/INFO/,"CATACH")
                    res = res.replace(/INFO/,"LIST")
                }else{
                    if(listFlag){
                        res = res.replace(/INFO/, 'LIST')
                        listFlag = false
                    }
                    if(/There are \d+\/\d+ players online/.test(res)){
                        listFlag = true
                    }
                }
                // console.log(iconv.decode(Buffer.from(data, 'binary'), 'cp936'))3
                // console.log(Buffer.from(data, 'binary').toString('utf-8'))
                ctx.app.io.of('/').to(room).emit('wensc', res);
            });
            serverStatus = true
            java.on('close', (code) => {
                serverStatus = false
                java = null
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
        let res = new Response({code: 1, msg: '进程关闭成功', data : ''})
        ctx.body = res
    }
    beginProcess(e){
        const { ctx, app } = this;
        flag = false
            serverStatus = true
        let res = new Response({code: 1, msg: '进程开启成功', data : ''})
        ctx.body = res
        if(!java){
            this.initialJava()
        }
    }
}
module.exports = DefaultController;
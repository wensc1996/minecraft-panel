// {app_root}/app/io/controller/default.js
'use strict';

const Controller = require('egg').Controller;
const { exec, spawn } = require('child_process');
const Response = require('../../../src/response')
const iconv = require('iconv-lite');
const Mysql = require('../../../src/mysql/connection')
// const java = spawn('cd', ["server/src/bridge/mine"]);
const path = require("path");
const os = require('os');

let java = null
let serverStatus = false
let listFlag = false
let playerList = []


const type = os.type();
const map = {
    Windows_NT: 0,
    linux: 1
}
const platform = map[type]
class DefaultController extends Controller {
    async initialJava(ctx) {
        let room = 'wensc'
        let mysql = new Mysql()
        let res = await mysql.action('select * from dispose')
        java = spawn(res[0].java_path ? res[0].java_path : 'java', [`-Xmx${res[0].max_memory_size}M`, `-Xms${res[0].min_memory_size}M`, '-jar', path.join(__dirname,`../../../../mc/${res[0].jar_name}`), 'nogui'], {cwd: path.join(__dirname,'../../../../mc')});
        java.stdout.on('data', (data) => {
            let res = ''
            if(platform == 0) {
                res = iconv.decode(Buffer.from(data, 'binary'), 'GBK')
            } else {
                res = data.toString('utf8')
            }
            let loginPlayer = res.match(/\: (\S+)\[\/\S+\] logged in with entity/)
			console.log(loginPlayer)
			
            if(loginPlayer) {
                let onePlayer = loginPlayer[1]
                playerList.push(onePlayer)
                ctx.app.io.of('/').to(room).emit('wensc', {
                    type: 'playerList',
                    data: playerList
                });
            }
            
            let logoutPlayer = res.match(/\: (\S+) lost connection/)
            if(logoutPlayer) {
                let onePlayer = logoutPlayer[1]
                playerList = playerList.filter(item => item!=onePlayer)
                ctx.app.io.of('/').to(room).emit('wensc', {
                    type: 'playerList',
                    data: playerList
                });
            }

            ctx.app.io.of('/').to(room).emit('wensc', {
                type: 'console',
                data: res
            });
        });
        java.stderr.on('data', (data) => {
            let res = ''
            if(platform == 0) {
                res = iconv.decode(Buffer.from(data, 'binary'), 'GBK')
            } else {
                res = data.toString('utf8')
            }
            let loginPlayer = res.match(/\: (\S+)\[\/\S+\] logged in with entity/)
            if(loginPlayer) {
                let onePlayer = loginPlayer[1]
                playerList.push(onePlayer)
                ctx.app.io.of('/').to(room).emit('wensc', {
                    type: 'playerList',
                    data: playerList
                });
            }
            let logoutPlayer = res.match(/\: (\S+) lost connection/)
            if(logoutPlayer) {
                let onePlayer = logoutPlayer[1]
                playerList = playerList.filter(item => item!=onePlayer)
                ctx.app.io.of('/').to(room).emit('wensc', {
                    type: 'playerList',
                    data: playerList
                });
            }
            ctx.app.io.of('/').to(room).emit('wensc', {
                type: 'console',
                data: res
            });
        });
        serverStatus = true
        java.on('close', (code) => {
            playerList = []
            ctx.app.io.of('/').to(room).emit('wensc', {
                type: 'playerList',
                data: playerList
            });
            serverStatus = false
            java = null
        });
    }
    getOnlinePlayerList() {
        const { ctx, app } = this;
        let res = new Response({code: 1, msg: '获取玩家列表成功', data : playerList})
        ctx.body = res
    }
    async thread() {
        const room = 'wensc'
        const { ctx, app } = this;
        if( ctx.socket) ctx.socket.join(room);
        const message = ctx.args[0];
        if(message && serverStatus){
            java.stdin.setEncoding('utf8');
            java.stdin.write(message+'\n');
        }
    }
    serverStatus(){
        const { ctx, app } = this;
        if(serverStatus){
            let res = new Response({code: 1, msg: '子进程在执行', data : ''})
            ctx.body = res
        }else{
            let res = new Response({code: -1, msg: '子进程已关闭', data : ''})
            ctx.body = res
        }
    }
    killProcess() {
        const { ctx, app } = this;
        if(serverStatus) {
            const room = 'wensc'
            java.kill('SIGTERM')
            playerList = []
            ctx.app.io.of('/').to(room).emit('wensc', {
                type: 'playerList',
                data: playerList
            });
            let res = new Response({code: 1, msg: '进程关闭成功', data : ''})
            ctx.body = res
        } else {
            let res = new Response({code: 0, msg: '进程已结束', data : ''})
            ctx.body = res
        }
    }
    beginProcess(){
        const { ctx, app } = this;
        if(!serverStatus){
            this.initialJava(ctx)
            let res = new Response({code: 1, msg: '游戏正在启动，请耐心等待', data : ''})
            ctx.body = res
        }
    }
}
module.exports = DefaultController;
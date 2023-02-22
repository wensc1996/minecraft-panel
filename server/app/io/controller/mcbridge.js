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
const GameConfig = require('../../../src/gameConfig');

let java = null
// 0 关闭，1启动中，2运行中，3停止中 
let serverStatus = 0
let listFlag = false
let playerList = []


const type = os.type();
const map = {
    Windows_NT: 0,
    linux: 1
}
const platform = map[type]
class DefaultController extends Controller {

    handleMessage(ctx, data, room) {
        let res = ''
        if(platform == 0) {
            res = iconv.decode(Buffer.from(data, 'binary'), 'GBK')
        } else {
            res = data.toString('utf8')
        }
        if(/Done \(\S+s\)\!/.test(res)) {
            serverStatus = 2
            ctx.app.io.of('/').to(room).emit('wensc', {
                type: 'serverStatus',
                data: serverStatus
            });
        }

        let loginPlayer = res.match(/(\S+)\[\/\S+\] logged in with entity/)
        if(loginPlayer) {
            let onePlayer = loginPlayer[1]
            playerList.push(onePlayer)
            ctx.app.io.of('/').to(room).emit('wensc', {
                type: 'playerList',
                data: playerList
            });
        }
        let logoutPlayer = res.match(/(\S+) lost connection/)
        if(logoutPlayer) {
            let onePlayer = logoutPlayer[1]
            playerList = playerList.filter(item => item!=onePlayer)
            ctx.app.io.of('/').to(room).emit('wensc', {
                type: 'playerList',
                data: playerList
            });
        }
        let kickoutPlayer = res.match(/把 (\S+) 从游戏中踢出/)
        if(kickoutPlayer) {
            let onePlayer = kickoutPlayer[1]
            playerList = playerList.filter(item => item != onePlayer)
            ctx.app.io.of('/').to(room).emit('wensc', {
                type: 'playerList',
                data: playerList
            });
        }
        ctx.app.io.of('/').to(room).emit('wensc', {
            type: 'console',
            data: res
        });
    }
    
    async initialJava(ctx) {
        let room = 'wensc'
        let checkConfig = new GameConfig()
        await checkConfig.getGameConfig()
        let checkResult = await checkConfig.checkRunConfig()
        if(checkResult.code != 1) {
            return new Response({code: checkResult.code, msg: checkResult.msg, data : ''})
        } else {
            let config = checkConfig.config
            java = spawn(config.java_path, [`-Xmx${config.max_memory_size}M`, `-Xms${config.min_memory_size}M`, '-jar', path.join(config.work_path, config.jar_name), 'nogui'], {cwd: config.work_path});
            java.stdout.on('data', (data) => {
                this.handleMessage(ctx, data, room)
            });
            java.stderr.on('data', (data) => {
                this.handleMessage(ctx, data, room)
            });
            java.on('close', (code) => {
                playerList = []
                ctx.app.io.of('/').to(room).emit('wensc', {
                    type: 'playerList',
                    data: playerList
                });
                java = null
                serverStatus = 0
                ctx.app.io.of('/').to(room).emit('wensc', {
                    type: 'serverStatus',
                    data: serverStatus
                });
            });
            serverStatus = 1
            ctx.app.io.of('/').to(room).emit('wensc', {
                type: 'serverStatus',
                data: serverStatus
            });
            return new Response({code: 1, msg: '已执行启动命令', data : ''})
        }
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
        if(message && serverStatus == 2){
            java.stdin.setEncoding('utf8');
            java.stdin.write(message+'\n');
        }
    }
    serverStatus(){
        const { ctx, app } = this;
        ctx.body = new Response({code: 1, msg: '进程状态', data : serverStatus})
    }
    killProcess() {
        const { ctx, app } = this;
        if(serverStatus == 2) {
            const room = 'wensc'
            java.kill('SIGINT')
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
    async beginProcess(){
        const { ctx, app } = this;
        if(serverStatus == 0){
            let res = await this.initialJava(ctx);
            ctx.body = res
        }
    }
}
module.exports = DefaultController;
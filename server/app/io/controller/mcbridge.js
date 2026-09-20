// {app_root}/app/io/controller/mcbridge.js
'use strict';

const Controller = require('egg').Controller;
const { spawn } = require('child_process');
const Response = require('../../../src/response')
const iconv = require('iconv-lite');
const path = require('path');
const os = require('os');
const db = require('../../../src/mysql/connection')
const { buildWorkPath } = require('../../../src/instancePath');

const type = os.type();
const map = { Windows_NT: 0, linux: 1 };
const platform = map[type];
const messageSplice = 3;

// 解析追加启动参数：按空白切分，支持双引号/单引号包裹含空格的参数；返回 argv 数组
function parseExtraArgs(str) {
    if (!str || typeof str !== 'string') return [];
    const tokens = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(str)) !== null) {
        tokens.push(m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]));
    }
    return tokens;
}

// 多实例运行时 Map：key = instanceId -> { java, serverStatus, playerList, messageQueue, timer }
const runtimes = new Map();

function getRuntime(id) {
    return runtimes.get(Number(id));
}
function ensureRuntime(id) {
    const key = Number(id);
    let rt = runtimes.get(key);
    if (!rt) {
        rt = { instanceId: key, java: null, serverStatus: 0, playerList: [], messageQueue: [], messageHistory: [], timer: null };
        runtimes.set(key, rt);
    }
    return rt;
}
// 校验实例归属当前租户（HTTP 走 tenant 中间件有 ctx.tenantId；socket 取 session）
async function isInstanceOwner(ctx, instanceId) {
    const tenantId = ctx.tenantId !== undefined && ctx.tenantId !== null
        ? ctx.tenantId
        : (ctx.session && ctx.session.tenantId);
    if (tenantId === undefined || tenantId === null) return false;
    const rows = await db.query('select tenant_id from dispose where instance_id = ?', [Number(instanceId)]);
    return !!(rows && rows.length && rows[0].tenant_id === Number(tenantId));
}

class DefaultController extends Controller {
    trimBlank(str) {
        return str.replace(/[\n\r\s]/g, '');
    }

    async handleMessage(ctx, data, rt) {
        try {
        const room = 'instance_' + rt.instanceId;
        let res = '';
        if (platform == 0) {
            res = iconv.decode(Buffer.from(data, 'binary'), 'GBK');
        } else {
            res = data.toString('utf8');
        }
        if (/Done \(\S+s\)\!/.test(res)) {
            rt.serverStatus = 2;
            ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'serverStatus', data: rt.serverStatus });
        }
        if (/That player cannot be found|无法找到该玩家/.test(res)) {
            ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'notFound', data: '' });
        }
        const spawnPointMatch = res.match(/Set (\S+)'s spawn point to|将(\S+)的出生点设置到/);
        if (spawnPointMatch) {
            const playerId = spawnPointMatch[1] || spawnPointMatch[2];
            const coordMatch = res.match(/(-?\d+, -?\d+, -?\d+)/) || res.match(/(-?\d+，-?\d+，-?\d+)/);
            if (coordMatch && coordMatch[1]) {
                const coordinate = this.trimBlank(coordMatch[1]).replace(/，/g, ',');
                ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'spawnPoint', data: { playerId, coordinate } });
            }
        }
        const loginPlayer = res.match(/(\S+)\[\/\S+\] logged in with entity/);
        if (loginPlayer) {
            rt.playerList.push(loginPlayer[1]);
            ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'playerList', data: rt.playerList });
        }
        const logoutPlayer = res.match(/(\S+) lost connection/);
        if (logoutPlayer) {
            rt.playerList = rt.playerList.filter(item => item !== logoutPlayer[1]);
            ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'playerList', data: rt.playerList });
        }
        const kickoutPlayer = res.match(/把 (\S+) 从游戏中踢出/);
        if (kickoutPlayer) {
            rt.playerList = rt.playerList.filter(item => item !== kickoutPlayer[1]);
            ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'playerList', data: rt.playerList });
        }
        rt.messageQueue.push(res);
        rt.messageHistory.push(res);
        if (rt.messageHistory.length > 200) rt.messageHistory.shift();
        } catch (e) {
            // 单条日志解析异常绝不可抛出到 stdout 事件回调外，否则会崩溃 worker 进程，
            // 进而使 agent/master 向已关闭的 IPC 通道发消息而报 ERR_IPC_CHANNEL_CLOSED
            console.error('[mcbridge] handleMessage parse error (ignored):', e && e.message);
        }
    }

    async initialJava(ctx, instanceId) {
        const rt = ensureRuntime(instanceId);
        const room = 'instance_' + instanceId;
        const rows = await db.query('select d.*, t.storage_path from dispose d left join tenant t on t.tenant_id = d.tenant_id where d.instance_id = ?', [Number(instanceId)]);
        if (!rows || !rows.length) return new Response({ code: -1, msg: '实例不存在', data: '' });
        const config = rows[0];
        // 实例仅存 java_dict_id，启动时才去 sys_dict 关联查询真实 JAVA 路径
        let javaPath = ''
        if (config.java_dict_id) {
            const d = await db.query('select dict_value from sys_dict where dict_type = ? and dict_id = ?', ['java_path', config.java_dict_id])
            if (d && d.length && d[0].dict_value) javaPath = d[0].dict_value
        }
        if (!javaPath) {
            return new Response({ code: -1, msg: '未配置可用的 JAVA 路径（请先在字典中维护 JAVA 路径）', data: '' });
        }
        config.java_path = javaPath
        // 工作目录由租户 storage_path + name 拼接（不落库）
        config.work_path = buildWorkPath(rows[0].storage_path, rows[0].name)
        if (config.launch_mode === 'raw') {
            if (!config.java_path || !config.work_path || !config.raw_args) {
                return new Response({ code: -1, msg: '实例运行配置不完整（raw 模式需 JAVA路径/工作目录/原始启动参数）', data: '' });
            }
        } else {
            if (!config.java_path || !config.work_path || !config.jar_name) {
                return new Response({ code: -1, msg: '实例运行配置不完整', data: '' });
            }
        }
        // 启动参数组装：raw 模式使用用户填写的原始整段参数；jar 模式使用结构化拼接
        let javaArgs;
        if (config.launch_mode === 'raw' && config.raw_args) {
            javaArgs = parseExtraArgs(config.raw_args);
        } else {
            javaArgs = [`-Xmx${config.max_memory_size}M`, `-Xms${config.min_memory_size}M`, '-jar', path.join(config.work_path, config.jar_name), 'nogui'];
        }
        rt.java = spawn(config.java_path, javaArgs, { cwd: config.work_path });
        // 每次启动先重置在线玩家列表，避免上一次运行的残留玩家显示在 UI 上
        rt.playerList = [];
        ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'playerList', data: rt.playerList });
        rt.java.stdout.on('data', (data) => this.handleMessage(ctx, data, rt));
        rt.java.stderr.on('data', (data) => this.handleMessage(ctx, data, rt));
        rt.java.on('close', () => {
            rt.playerList = [];
            ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'playerList', data: rt.playerList });
            rt.java = null;
            rt.serverStatus = 0;
            ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'serverStatus', data: rt.serverStatus });
        });
        rt.serverStatus = 1;
        ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'serverStatus', data: rt.serverStatus });
        return new Response({ code: 0, msg: '已执行启动命令', data: '' });
    }

    async getOnlinePlayerList() {
        const { ctx } = this;
        const instanceId = ctx.query.instanceId;
        if (!(await isInstanceOwner(ctx, instanceId))) { ctx.body = new Response({ code: -403, msg: '无权操作该实例' }); return; }
        const rt = getRuntime(instanceId);
        ctx.body = new Response({ code: 0, msg: '获取玩家列表成功', data: rt ? rt.playerList : [] });
    }

    async joinRoom() {
        const { ctx } = this;
        const message = ctx.args[0] || {};
        const instanceId = message.instanceId;
        if (!instanceId) { ctx.body = new Response({ code: -1, msg: '缺少 instanceId' }); return; }
        if (!(await isInstanceOwner(ctx, instanceId))) { ctx.body = new Response({ code: -403, msg: '无权访问该实例' }); return; }
        const rt = ensureRuntime(instanceId);
        const room = 'instance_' + instanceId;
        if (ctx.socket) {
            // 切换实例时退出其它实例房间，避免仍收到别的实例的实时日志
            const rooms = ctx.socket.rooms;
            const roomList = rooms instanceof Set ? [...rooms] : Object.keys(rooms || {});
            for (const r of roomList) {
                if (r.startsWith('instance_') && r !== room) {
                    ctx.socket.leave(r);
                }
            }
            ctx.socket.join(room);
        }
        if (!rt.timer) {
            rt.timer = setInterval(() => {
                if (rt.messageQueue.length > 0) {
                    const sendQueue = rt.messageQueue.length >= messageSplice
                        ? rt.messageQueue.splice(0, messageSplice)
                        : rt.messageQueue.splice(0, rt.messageQueue.length);
                    ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'console', data: sendQueue });
                }
            }, 1000);
        }
        ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'serverStatus', data: rt.serverStatus });
        ctx.app.io.of('/').to(room).emit('mcpanel', { type: 'playerList', data: rt.playerList });
        // 首次进入：把已产生的历史控制台消息回推给当前 socket，避免与定时器重复推送未 flush 的 messageQueue
        if (ctx.socket) {
            const tail = rt.messageQueue.length;
            const history = tail
                ? rt.messageHistory.slice(0, rt.messageHistory.length - tail)
                : rt.messageHistory.slice();
            if (history.length) {
                ctx.socket.emit('mcpanel', { type: 'console', data: history.reverse() });
            }
        }
        ctx.body = new Response({ code: 0, msg: '加入房间成功', data: '' });
    }

    async thread() {
        const { ctx } = this;
        const message = ctx.args[0] || {};
        const instanceId = message.instanceId;
        const cmd = message.cmd;
        const rt = getRuntime(instanceId);
        if (rt && rt.java && rt.serverStatus == 2 && cmd) {
            rt.java.stdin.setEncoding('utf8');
            rt.java.stdin.write(cmd + '\n');
        }
    }

    async serverStatus() {
        const { ctx } = this;
        const instanceId = ctx.query.instanceId;
        if (!(await isInstanceOwner(ctx, instanceId))) { ctx.body = new Response({ code: -403, msg: '无权操作该实例' }); return; }
        const rt = getRuntime(instanceId);
        ctx.body = new Response({ code: 0, msg: '进程状态', data: rt ? rt.serverStatus : 0 });
    }

    async killProcess() {
        const { ctx } = this;
        const instanceId = ctx.request.body.instanceId;
        if (!(await isInstanceOwner(ctx, instanceId))) { ctx.body = new Response({ code: -403, msg: '无权操作该实例' }); return; }
        const rt = getRuntime(instanceId);
        if (rt && rt.java) {
            rt.java.kill('SIGINT');
            rt.playerList = [];
            ctx.app.io.of('/').to('instance_' + instanceId).emit('mcpanel', { type: 'playerList', data: rt.playerList });
            ctx.body = new Response({ code: 0, msg: '进程关闭成功', data: '' });
        } else {
            ctx.body = new Response({ code: 0, msg: '进程已结束', data: '' });
        }
    }

    async beginProcess() {
        const { ctx } = this;
        const instanceId = ctx.request.body.instanceId;
        if (!(await isInstanceOwner(ctx, instanceId))) { ctx.body = new Response({ code: -403, msg: '无权操作该实例' }); return; }
        // 到期时间校验：非空且已过期则禁止启动
        const exp = await db.query('select expire_at from dispose where instance_id = ? and tenant_id = ?', [Number(instanceId), ctx.tenantId]);
        if (exp && exp.length && exp[0].expire_at) {
            const expire = new Date(exp[0].expire_at);
            if (!isNaN(expire.getTime()) && expire.getTime() <= Date.now()) {
                const p = n => (n < 10 ? '0' + n : '' + n);
                const expStr = expire.getFullYear() + '-' + p(expire.getMonth() + 1) + '-' + p(expire.getDate()) + ' ' + p(expire.getHours()) + ':' + p(expire.getMinutes());
                ctx.body = new Response({ code: -1, msg: '实例已过期（到期时间 ' + expStr + '），无法启动，请先在配置管理中延长或清空到期时间' });
                return;
            }
        }
        const rt = getRuntime(instanceId);
        if (rt && rt.serverStatus == 0) {
            ctx.body = await this.initialJava(ctx, instanceId);
        } else {
            ctx.body = new Response({ code: 0, msg: '实例已在运行或启动中', data: '' });
        }
    }
}

// 优雅退出：关闭所有实例进程与定时器
function gracefulExit() {
    for (const rt of runtimes.values()) {
        if (rt.java) { try { rt.java.kill('SIGINT'); } catch (e) {} }
        if (rt.timer) clearInterval(rt.timer);
    }
}
process.once('SIGINT', () => { gracefulExit(); process.exit(0); });
process.once('SIGTERM', () => { gracefulExit(); process.exit(0); });

module.exports = DefaultController;

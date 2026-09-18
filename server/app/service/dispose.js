const Service = require('egg').Service;
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')
const fs = require('fs')
const { isValidInstanceName, buildWorkPath } = require('../../src/instancePath')

// 将 Date / 可解析时间统一格式化为 MySQL datetime 字符串（YYYY-MM-DD HH:mm:ss），空值返回 null
function fmtDateTime(val) {
    if (!val) return null
    const d = (val instanceof Date) ? val : new Date(val)
    if (isNaN(d.getTime())) return null
    const p = n => (n < 10 ? '0' + n : '' + n)
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
}

// 生成实例ID：毫秒时间戳(13位) * 1000 + 3位随机 → 16位以内整数，
// 既落在 JS 安全整数范围（< 2^53）也落在 BIGINT 范围，非自增、不可简单枚举；
// 时间戳前缀便于按创建时间排序
function genInstanceId() {
    return Date.now() * 1000 + (Math.floor(Math.random() * 900) + 100)
}

class DisposeService extends Service {
    // 本租户实例列表（不含 work_path 等敏感细节，按需再拉取）
    async getServerInstances() {
        const tenantId = this.ctx.tenantId
        // 实例只存 java_dict_id，java 路径/名称按需关联 sys_dict 查询
        const list = await db.query(
            `select d.instance_id, d.tenant_id, d.name, d.game_port, d.jar_name,
                    d.max_memory_size, d.min_memory_size, d.max_players,
                    d.expire_at,
                    d.java_dict_id, sd.dict_value as java_path, sd.dict_name as java_dict_name
             from dispose d
             left join sys_dict sd on sd.dict_id = d.java_dict_id and sd.dict_type = 'java_path'
             where d.tenant_id = ? order by d.instance_id`,
            [tenantId]
        )
        list.forEach(r => { r.expire_at = fmtDateTime(r.expire_at) })
        return new Response({ code: 0, msg: '获取实例列表成功', data: list })
    }
    // 获取某实例配置（校验租户归属）
    async getGameDispose(options) {
        const tenantId = this.ctx.tenantId
        const instanceId = options.instanceId
        if (!instanceId) return new Response({ code: -1, msg: '缺少 instanceId' })
        // 实例只存 java_dict_id，java 路径/名称按需关联 sys_dict 查询；工作目录由租户 storage_path + name 拼接（不落库）
        const res = await db.query(
            `select d.*, sd.dict_value as java_path, sd.dict_name as java_dict_name, t.storage_path
             from dispose d
             left join sys_dict sd on sd.dict_id = d.java_dict_id and sd.dict_type = 'java_path'
             left join tenant t on t.tenant_id = d.tenant_id
             where d.instance_id = ? and d.tenant_id = ?`,
            [instanceId, tenantId]
        )
        if (res && res.length) {
            res[0].work_path = buildWorkPath(res[0].storage_path, res[0].name)
            // 到期时间格式化为本地字符串（避免 Date 经 JSON 序列化为 ISO 的时区偏移）
            res[0].expire_at = fmtDateTime(res[0].expire_at)
            return new Response({ code: 0, msg: '获取游戏配置成功', data: res[0] })
        }
        return new Response({ code: -1, msg: '未找到该实例配置' })
    }
    // 解析实例要落库的 java 字典 id：实例仅存储字典 id，真实路径/名称在启动、展示时关联 sys_dict 查询
    // - 优先使用前端传入的 javaDictId（下拉已选项）
    // - 若仅传入自定义 javaPath（下拉 allow-create），则保证其在 sys_dict 中存在并取其 id
    async resolveJavaDictId(options) {
        const javaDictId = options.javaDictId ? Number(options.javaDictId) : null
        if (javaDictId) return javaDictId
        if (options.javaPath) {
            try { await this.ctx.service.dict.addJavaPathHistory(options.javaPath) } catch (e) { /* 忽略 */ }
            const d = await db.query('select dict_id from sys_dict where dict_type = ? and dict_value = ?', ['java_path', options.javaPath])
            if (d && d.length) return d[0].dict_id
        }
        return null
    }
    // 新增实例：端口全服唯一，work_path 后端在其租户 storage_path 下以“实例名称”生成子目录
    async addInstance(options) {
        // 新增实例为平台级操作：仅平台管理员可执行（其余角色无此权限）
        if (!this.ctx.isPlatformAdmin) {
            return new Response({ code: -1, msg: '仅平台管理员可新增实例' })
        }
        const tenantId = this.ctx.tenantId
        const name = options.name || '服务器实例'
        const launchMode = options.launchMode || 'jar'
        const rawArgs = options.rawArgs || ''
        const expireAt = options.expireAt ? options.expireAt : null
        const gamePort = options.gamePort || null
        const playerNum = options.playerNum || null
        const maxMemorySize = options.maxMemorySize
        const minMemorySize = options.minMemorySize
        const jarName = options.jarName
        // 实例名称仅支持中文、字母、数字（作为目录名使用），且同租户唯一
        if (!isValidInstanceName(name)) {
            return new Response({ code: -1, msg: '实例名称仅支持中文、字母、数字' })
        }
        const dupName = await db.query('select instance_id from dispose where tenant_id = ? and name = ?', [tenantId, name])
        if (dupName && dupName.length) {
            return new Response({ code: -1, msg: '实例名称已存在' })
        }
        // 实例仅存储 java_dict_id；真实路径在启动/展示时去 sys_dict 关联查询
        const javaDictIdStored = await this.resolveJavaDictId(options)
        if (launchMode === 'raw') {
            if (!javaDictIdStored || !rawArgs) {
                return new Response({ code: -1, msg: '参数错误：JAVA路径与原始启动参数必填' })
            }
        } else {
            if (!jarName || !javaDictIdStored) {
                return new Response({ code: -1, msg: '参数错误：服务端文件名/JAVA路径必填' })
            }
        }
        // 端口全服唯一（跨租户，仅当填写时校验）
        if (gamePort) {
            const dup = await db.query('select instance_id from dispose where game_port = ?', [gamePort])
            if (dup && dup.length) {
                return new Response({ code: -1, msg: '游戏端口已被占用（全服唯一）' })
            }
        }
        // 取租户存储根目录
        const t = await db.query('select storage_path from tenant where tenant_id = ?', [tenantId])
        if (!t || !t.length || !t[0].storage_path) {
            return new Response({ code: -1, msg: '租户存储目录未配置' })
        }
        // 生成非自增实例ID（毫秒时间戳*1000 + 3位随机），并校验唯一
        let instanceId
        for (let i = 0; i < 5; i++) {
            const cand = genInstanceId()
            const exist = await db.query('select instance_id from dispose where instance_id = ?', [cand])
            if (!exist || !exist.length) { instanceId = cand; break }
        }
        if (!instanceId) {
            return new Response({ code: -1, msg: '生成实例ID失败，请重试' })
        }
        try {
            await db.query(
                'insert into dispose (instance_id, tenant_id, name, game_port, max_players, max_memory_size, min_memory_size, jar_name, java_dict_id, launch_mode, raw_args, expire_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [instanceId, tenantId, name, gamePort, playerNum, maxMemorySize, minMemorySize, jarName, javaDictIdStored, launchMode, rawArgs, expireAt]
            )
            // 工作目录 = 租户存储根目录 + 实例名称（name 仅含中文/字母/数字，天然安全），不落库
            const workPath = buildWorkPath(t[0].storage_path, name)
            // 若目录已存在于磁盘，则直接复用该目录（不清空、不重命名），否则创建
            try {
                fs.mkdirSync(workPath, { recursive: true })
            } catch (e) {
                await db.query('delete from dispose where instance_id = ?', [instanceId])
                return new Response({ code: -1, msg: '实例工作目录创建失败：' + e.message })
            }
            // 新增后立即快照一份历史配置（按 tenant_id + name upsert）
            await this.snapshotHistory(instanceId, tenantId)
            return new Response({ code: 0, msg: '新增实例成功', data: { instanceId, workPath } })
        } catch (e) {
            return new Response({ code: -1, msg: '新增实例失败：' + e.message })
        }
    }
    // 更新实例配置（端口唯一排除自身；work_path 不可被前端覆盖，只来自库）
    async updateGameDispose(options) {
        const tenantId = this.ctx.tenantId
        const instanceId = options.instanceId
        if (!instanceId) return new Response({ code: -1, msg: '缺少 instanceId' })
        // 实例仅存储 java_dict_id；真实路径在启动/展示时去 sys_dict 关联查询
        const javaDictIdStored = await this.resolveJavaDictId(options)
        // 取当前实例（用于 name 变更时重命名目录、及名字唯一性校验）
        const cur = await db.query('select name from dispose where instance_id = ? and tenant_id = ?', [instanceId, tenantId])
        if (!cur || !cur.length) return new Response({ code: -1, msg: '实例不存在' })
        const curName = cur[0].name
        // 名称变更：校验格式 + 同租户唯一（排除自身）；目录随之重命名
        let newName = curName
        const nameChanged = !!(options.name && options.name !== curName)
        if (nameChanged) {
            if (!isValidInstanceName(options.name)) {
                return new Response({ code: -1, msg: '实例名称仅支持中文、字母、数字' })
            }
            const dup = await db.query(
                'select instance_id from dispose where tenant_id = ? and name = ? and instance_id != ?',
                [tenantId, options.name, instanceId]
            )
            if (dup && dup.length) {
                return new Response({ code: -1, msg: '实例名称已存在' })
            }
            newName = options.name
        }
        if (options.gamePort) {
            const dup = await db.query(
                'select instance_id from dispose where instance_id != ? and (game_port = ?)',
                [instanceId, options.gamePort]
            )
            if (dup && dup.length) {
                return new Response({ code: -1, msg: '游戏端口已被占用（全服唯一）' })
            }
        }
        // 动态拼装更新字段
        const fields = []
        const params = []
        if (options.gamePort !== undefined) { fields.push('game_port = ?'); params.push(options.gamePort) }
        if (options.playerNum !== undefined) { fields.push('max_players = ?'); params.push(options.playerNum) }
        if (options.maxMemorySize !== undefined) { fields.push('max_memory_size = ?'); params.push(options.maxMemorySize) }
        if (options.minMemorySize !== undefined) { fields.push('min_memory_size = ?'); params.push(options.minMemorySize) }
        if (options.jarName !== undefined) { fields.push('jar_name = ?'); params.push(options.jarName) }
        if (nameChanged) { fields.push('name = ?'); params.push(newName) }
        fields.push('java_dict_id = ?'); params.push(javaDictIdStored)
        if (options.launchMode !== undefined) { fields.push('launch_mode = ?'); params.push(options.launchMode) }
        if (options.rawArgs !== undefined) { fields.push('raw_args = ?'); params.push(options.rawArgs) }
        // 实例到期时间为平台级字段：仅平台管理员可覆盖，其余角色保存时忽略 expire_at（保持库中原值，防止越权改写到期时间）
        if (this.ctx.isPlatformAdmin && options.expireAt !== undefined) { fields.push('expire_at = ?'); params.push(options.expireAt ? options.expireAt : null) }
        params.push(instanceId, tenantId)
        const res = await db.query(
            'update dispose set ' + fields.join(', ') + ' where instance_id = ? and tenant_id = ?',
            params
        )
        if (res) {
            // 工作目录以「租户 storage_path + 实例名称」推算：目录不存在则新建，已存在则直接复用（不重命名、不清空）
            const t = await db.query('select storage_path from tenant where tenant_id = ?', [tenantId])
            const storageRoot = t && t.length ? t[0].storage_path : ''
            if (storageRoot) {
                const workPath = buildWorkPath(storageRoot, newName)
                try {
                    fs.mkdirSync(workPath, { recursive: true })
                } catch (e) {
                    return new Response({ code: -1, msg: '实例工作目录创建失败：' + e.message })
                }
            }
            // 更新成功后，按 tenant_id + name 快照历史配置（同名直接覆盖）
            await this.snapshotHistory(instanceId, tenantId)
            return new Response({ code: 0, msg: '更新游戏配置成功', data: '' })
        }
        return new Response({ code: -1, msg: '更新失败' })
    }
    // 删除实例：删记录 + 删工作目录（工作目录由租户 storage_path + name 推算，不落库）
    async deleteInstance(options) {
        // 删除实例为平台级操作：仅平台管理员可执行
        if (!this.ctx.isPlatformAdmin) {
            return new Response({ code: -1, msg: '仅平台管理员可删除实例' })
        }
        const tenantId = this.ctx.tenantId
        const instanceId = options.instanceId
        if (!instanceId) return new Response({ code: -1, msg: '缺少 instanceId' })
        const rows = await db.query('select d.name, t.storage_path from dispose d left join tenant t on t.tenant_id = d.tenant_id where d.instance_id = ? and d.tenant_id = ?', [instanceId, tenantId])
        if (rows && rows.length && rows[0].storage_path && rows[0].name) {
            const workPath = buildWorkPath(rows[0].storage_path, rows[0].name)
            try { fs.rmSync(workPath, { recursive: true, force: true }) } catch (e) { /* 忽略 */ }
        }
        const res = await db.query('delete from dispose where instance_id = ? and tenant_id = ?', [instanceId, tenantId])
        if (res) {
            return new Response({ code: 0, msg: '删除实例成功', data: '' })
        }
        return new Response({ code: -1, msg: '删除失败' })
    }
    // 将某实例的当前配置快照 upsert 进历史表（按 tenant_id + name 唯一）
    async snapshotHistory(instanceId, tenantId) {
        const snap = await db.query(
            `select d.name, d.game_port, d.max_players, d.min_memory_size, d.max_memory_size,
                    d.jar_name, d.java_dict_id, d.launch_mode, d.raw_args, d.expire_at,
                    sd.dict_value as java_path
             from dispose d
             left join sys_dict sd on sd.dict_id = d.java_dict_id and sd.dict_type = 'java_path'
             where d.instance_id = ? and d.tenant_id = ?`,
            [instanceId, tenantId]
        )
        if (!snap || !snap.length) return
        const r = snap[0]
        const config = {
            name: r.name,
            gamePort: r.game_port,
            playerNum: r.max_players,
            minMemorySize: r.min_memory_size,
            maxMemorySize: r.max_memory_size,
            jarName: r.jar_name,
            javaPath: r.java_path,
            javaDictId: r.java_dict_id,
            launchMode: r.launch_mode,
            rawArgs: r.raw_args,
            expireAt: fmtDateTime(r.expire_at)
        }
        const configStr = JSON.stringify(config)
        const exist = await db.query('select id from dispose_history where tenant_id = ? and name = ?', [tenantId, r.name])
        if (exist && exist.length) {
            await db.query('update dispose_history set config = ? where tenant_id = ? and name = ?', [configStr, tenantId, r.name])
        } else {
            await db.query('insert into dispose_history (tenant_id, name, config) values (?, ?, ?)', [tenantId, r.name, configStr])
        }
    }
    // 历史配置列表（仅返回 id/name/更新时间，配置详情按需再取）
    async getDisposeHistoryList() {
        const tenantId = this.ctx.tenantId
        const list = await db.query(
            'select id, name, update_time from dispose_history where tenant_id = ? order by update_time desc',
            [tenantId]
        )
        return new Response({ code: 0, msg: '获取历史配置列表成功', data: list || [] })
    }
    // 历史配置详情（返回完整 config 快照，用于切换回填表单）
    async getDisposeHistoryDetail(options) {
        const tenantId = this.ctx.tenantId
        const id = options.id
        if (!id) return new Response({ code: -1, msg: '缺少 id' })
        const res = await db.query('select id, name, config from dispose_history where id = ? and tenant_id = ?', [id, tenantId])
        if (res && res.length) {
            let config = res[0].config
            if (typeof config === 'string') {
                try { config = JSON.parse(config) } catch (e) { config = {} }
            }
            return new Response({ code: 0, msg: '获取历史配置成功', data: { id: res[0].id, name: res[0].name, config } })
        }
        return new Response({ code: -1, msg: '未找到该历史配置' })
    }
    // 删除某条历史配置（按 tenant_id + id 隔离）
    async deleteDisposeHistory(options) {
        const tenantId = this.ctx.tenantId
        const id = options.id
        if (!id) return new Response({ code: -1, msg: '缺少 id' })
        const res = await db.query('delete from dispose_history where id = ? and tenant_id = ?', [id, tenantId])
        if (res) return new Response({ code: 0, msg: '删除历史配置成功', data: '' })
        return new Response({ code: -1, msg: '删除失败' })
    }
}
module.exports = DisposeService;

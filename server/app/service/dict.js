const Service = require('egg').Service;
const db = require('../../src/mysql/connection')
const Response = require('../../src/response')

// 生成字典 key：时间戳(36进制) + 随机串，保证不重复且不存放业务值（如路径）
function genDictKey() {
    const ts = Date.now().toString(36)
    const rand = Math.random().toString(36).slice(2, 8)
    return 'k_' + ts + rand
}

class DictService extends Service {
    // 字典列表：可按 dict_type 过滤，便于前端按类型取下拉数据
    async listDict(options) {
        const dictType = options.dictType || ''
        let sql = 'select * from sys_dict'
        const params = []
        if (dictType) {
            sql += ' where dict_type = ?'
            params.push(dictType)
        }
        sql += ' order by sort asc, dict_id desc'
        const list = await db.query(sql, params)
        return new Response({ code: 0, msg: '获取字典列表成功', data: list })
    }
    // 新增字典项（java 路径等平台级配置，仅平台管理员可操作）
    async addDict(options) {
        if (!this.ctx.isPlatformAdmin) {
            return new Response({ code: -403, msg: '仅平台管理员可新增字典项' })
        }
        const dictType = options.dictType
        const dictValue = options.dictValue
        const dictName = options.dictName || ''
        const sort = options.sort || 0
        const remark = options.remark || null
        if (!dictType || dictValue === undefined) {
            return new Response({ code: -1, msg: '参数错误：dictType / dictValue 必填' })
        }
        // dict_key 由后端生成唯一 id，不接收前端传入的业务值（如路径），避免乱存
        const dictKey = genDictKey()
        const res = await db.query(
            'insert into sys_dict (dict_type, dict_key, dict_value, dict_name, sort, remark) values (?, ?, ?, ?, ?, ?)',
            [dictType, dictKey, dictValue, dictName, sort, remark]
        )
        return new Response({ code: 0, msg: '新增字典项成功', data: { dictId: res.insertId } })
    }
    // 更新字典项
    async updateDict(options) {
        const dictId = options.dictId
        if (!dictId) return new Response({ code: -1, msg: '缺少 dictId' })
        const fields = []
        const params = []
        if (options.dictType !== undefined) { fields.push('dict_type = ?'); params.push(options.dictType) }
        if (options.dictKey !== undefined) { fields.push('dict_key = ?'); params.push(options.dictKey) }
        if (options.dictValue !== undefined) { fields.push('dict_value = ?'); params.push(options.dictValue) }
        if (options.dictName !== undefined) { fields.push('dict_name = ?'); params.push(options.dictName) }
        if (options.sort !== undefined) { fields.push('sort = ?'); params.push(options.sort) }
        if (options.remark !== undefined) { fields.push('remark = ?'); params.push(options.remark) }
        if (!fields.length) return new Response({ code: -1, msg: '无更新字段' })
        params.push(dictId)
        await db.query('update sys_dict set ' + fields.join(', ') + ' where dict_id = ?', params)
        return new Response({ code: 0, msg: '更新字典项成功', data: '' })
    }
    // 删除字典项（java 路径等平台级配置，仅平台管理员可操作）
    async deleteDict(options) {
        if (!this.ctx.isPlatformAdmin) {
            return new Response({ code: -403, msg: '仅平台管理员可删除字典项' })
        }
        const dictId = options.dictId
        if (!dictId) return new Response({ code: -1, msg: '缺少 dictId' })
        await db.query('delete from sys_dict where dict_id = ?', [dictId])
        return new Response({ code: 0, msg: '删除字典项成功', data: '' })
    }
    // 记录 java 路径历史：同一 dict_type + dict_value 不重复插入，方便前端下拉复用历史路径
    async addJavaPathHistory(javaPath) {
        if (!javaPath) return
        const exist = await db.query('select dict_id from sys_dict where dict_type = ? and dict_value = ?', ['java_path', javaPath])
        if (exist && exist.length) return
        await db.query(
            'insert into sys_dict (dict_type, dict_key, dict_value, dict_name) values (?, ?, ?, ?)',
            ['java_path', genDictKey(), javaPath, javaPath]
        )
    }
}
module.exports = DictService;

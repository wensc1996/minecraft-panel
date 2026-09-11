<template>
    <div class="service-page">
        <div class="list-head">
            <span class="list-title">服务器实例</span>
            <el-button size="mini" type="primary" @click="showAdd = true">新增实例</el-button>
        </div>
        <el-row :gutter="16" class="card-wrap">
            <el-col :span="8" v-for="item in instances" :key="item.instance_id">
                <el-card shadow="hover" class="instance-card"
                         :class="{ active: String(item.instance_id) === String(currentInstanceId) }"
                         @click.native="goInstance(item)">
                    <div slot="header" class="card-header">
                        <span class="name">{{ item.name }}</span>
                        <el-button size="mini" type="danger" @click.stop="delInstance(item)">删除</el-button>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <span>运行状态</span>
                            <el-tag :type="statusMeta(item.status).type" size="mini">{{ statusMeta(item.status).text }}</el-tag>
                        </div>
                        <div class="row"><span>在线人数</span><b>{{ item.onlineCount || 0 }} 人</b></div>
                        <div class="row" v-if="item.expire_at">
                            <span>到期时间</span>
                            <b :class="{ 'expire-due': isExpired(item.expire_at) }">{{ item.expire_at }}</b>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="24" v-if="instances.length === 0">
                <el-empty description="暂无实例，点击右上角“新增实例”"></el-empty>
            </el-col>
        </el-row>

        <el-dialog :visible.sync="showAdd" width="520px" class="add-instance-dialog" :close-on-click-modal="false">
            <div slot="title" class="dialog-title">
                <i class="el-icon-plus"></i>
                <span>新增服务器实例</span>
            </div>
            <el-form :model="form" label-position="top" class="add-form">
                <el-form-item label="实例名称" required>
                    <el-input v-model="form.name" prefix-icon="el-icon-tickets" placeholder="例如：生存服 / Forge 整合包"></el-input>
                </el-form-item>
                <el-form-item label="JAVA 路径" required>
                    <div class="java-path-row">
                        <el-select v-model="form.javaPath" placeholder="选择 / 输入 Java 路径" filterable allow-create default-first-option style="flex:1">
                            <el-option v-for="item in javaPaths" :key="item.dict_id" :label="item.dict_name || item.dict_value" :value="item.dict_value">
                                <div style="display:flex; align-items:center; width:100%;">
                                    <span style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ item.dict_name || item.dict_value }}</span>
                                    <span style="flex:1 1 auto; min-width:0; margin-left:8px; color:#8492a6; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ item.dict_value }}</span>
                                    <i class="el-icon-delete" style="flex:0 0 auto; margin-left:8px; color:#f56c6c; cursor:pointer;" title="删除该 JAVA 路径" @click.stop="delJavaPath(item.dict_id)"></i>
                                </div>
                            </el-option>
                        </el-select>
                        <el-button size="small" type="primary" icon="el-icon-plus" @click="openJavaPathDialog">新建</el-button>
                    </div>
                </el-form-item>
                <div class="mode-section">
                    <el-form-item label="启动模式">
                        <el-radio-group v-model="form.launchMode" class="launch-mode">
                            <el-radio-button label="jar">java -jar（常规）</el-radio-button>
                            <el-radio-button label="raw">原始启动参数（自定义）</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-alert
                        v-if="form.launchMode === 'raw'"
                        type="warning"
                        :closable="false"
                        show-icon
                        class="mode-tip"
                        title="原始启动参数模式"
                        description="将完全接管启动命令，请自行写全 java 之后的所有参数（含内存、argfile 等）。">
                    </el-alert>
                    <template v-if="form.launchMode === 'jar'">
                        <el-form-item label="服务端文件名" required>
                            <el-input v-model="form.jarName" prefix-icon="el-icon-document" placeholder="如 server.jar / paper.jar"></el-input>
                        </el-form-item>
                        <div class="mem-row">
                            <el-form-item label="最小内存 (M)">
                                <el-input v-model="form.minMemorySize" placeholder="1024"></el-input>
                            </el-form-item>
                            <el-form-item label="最大内存 (M)">
                                <el-input v-model="form.maxMemorySize" placeholder="4096"></el-input>
                            </el-form-item>
                        </div>
                    </template>
                    <el-form-item v-else label="原始启动参数" required>
                        <el-input type="textarea" :rows="4" v-model="form.rawArgs" placeholder="java 之后的完整参数，例如：-Xms2500M -Xmx4G @libraries/net/minecraftforge/forge/1.20.1-47.4.0/win_args.txt nogui"></el-input>
                    </el-form-item>
                    <el-form-item label="到期时间">
                        <el-date-picker v-model="form.expireAt" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="为空表示不限制使用时间" size="small" style="width:100%"></el-date-picker>
                    </el-form-item>
                </div>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="showAdd = false">取消</el-button>
                <el-button type="primary" @click="addInstance">创建实例</el-button>
            </span>
        </el-dialog>

        <el-dialog :visible.sync="showJavaPath" width="460px" class="java-path-dialog" :close-on-click-modal="false">
            <div slot="title" class="dialog-title">
                <i class="el-icon-cpu"></i>
                <span>新建 Java 路径</span>
            </div>
            <el-form :model="javaForm" label-position="top" class="add-form">
                <el-form-item label="名称" required>
                    <el-input v-model="javaForm.dictName" placeholder="如 JAVA17 / JDK21"></el-input>
                </el-form-item>
                <el-form-item label="Java 路径" required>
                    <el-input v-model="javaForm.dictValue" placeholder="java 可执行文件完整路径，如 D:\JAVA17\bin\java.exe"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="showJavaPath = false">取消</el-button>
                <el-button type="primary" @click="addJavaPath">保存</el-button>
            </span>
        </el-dialog>
    </div>
</template>
<script>
export default {
    data () {
        return {
            instances: [],
            showAdd: false,
            javaPaths: [],
            showJavaPath: false,
            javaForm: { dictName: '', dictValue: '' },
            form: { name: '', javaPath: '', jarName: '', maxMemorySize: '', minMemorySize: '', launchMode: 'jar', rawArgs: '', expireAt: '' }
        }
    },
    computed: {
        currentInstanceId () {
            return this.$store.state.currentInstanceId
        }
    },
    methods: {
        toDbDateTime(val) {
            if (!val) return null
            if (typeof val === 'string') return val
            if (val instanceof Date) {
                const p = n => (n < 10 ? '0' + n : '' + n)
                return val.getFullYear() + '-' + p(val.getMonth() + 1) + '-' + p(val.getDate()) + ' ' + p(val.getHours()) + ':' + p(val.getMinutes()) + ':' + p(val.getSeconds())
            }
            return null
        },
        async loadInstances () {
            let res = await this.get('wensc/server-instances', {})
            if (res.data.code === 0) {
                this.instances = (res.data.data || []).map(i => ({ ...i, status: 0, onlineCount: 0 }))
                if (this.currentInstanceId && !this.instances.find(i => String(i.instance_id) === String(this.currentInstanceId))) {
                    this.$store.commit('SETINSTANCE', '')
                }
                this.refreshInstanceStates()
            } else {
                this.tip(-1, res.data.msg)
            }
        },
        // 同步各实例的运行状态与在线人数到卡片
        async refreshInstanceStates () {
            await Promise.all(this.instances.map(async inst => {
                try {
                    const [st, pl] = await Promise.all([
                        this.get('wensc/serverStatus', { instanceId: inst.instance_id }),
                        this.get('wensc/getOnlinePlayerList', { instanceId: inst.instance_id })
                    ])
                    inst.status = (st.data && st.data.code === 0) ? st.data.data : 0
                    const list = (pl.data && pl.data.code === 0) ? pl.data.data : []
                    inst.onlineCount = Array.isArray(list) ? list.length : 0
                } catch (e) { /* 忽略单实例查询异常 */ }
            }))
        },
        statusMeta (s) {
            if (s === 2) return { text: '运行中', type: 'success' }
            if (s === 1) return { text: '启动中', type: 'warning' }
            return { text: '已停止', type: 'info' }
        },
        isExpired (val) {
            if (!val) return false
            const t = new Date(String(val).replace(/-/g, '/')).getTime()
            return !isNaN(t) && t <= Date.now()
        },
        goInstance (row) {
            this.$store.commit('SETINSTANCE', row.instance_id)
            this.$router.push('/home/service/' + row.instance_id)
        },
        async addInstance () {
            if (!this.form.name) {
                this.$message.warning('实例名称必填')
                return
            }
            if (this.form.launchMode === 'raw') {
                if (!this.form.javaPath || !this.form.rawArgs) {
                    this.$message.warning('JAVA路径与原始启动参数必填')
                    return
                }
            } else {
                if (!this.form.jarName || !this.form.javaPath) {
                    this.$message.warning('服务端文件名/JAVA路径必填')
                    return
                }
            }
            const selJava = this.javaPaths.find(i => i.dict_value === this.form.javaPath)
            const javaDictId = selJava ? selJava.dict_id : ''
            let res = await this.post('wensc/addInstance', {
                name: this.form.name,
                javaPath: this.form.javaPath,
                javaDictId: javaDictId,
                launchMode: this.form.launchMode,
                jarName: this.form.launchMode === 'jar' ? this.form.jarName : '',
                maxMemorySize: this.form.launchMode === 'jar' ? (Number(this.form.maxMemorySize) || 1024) : 0,
                minMemorySize: this.form.launchMode === 'jar' ? (Number(this.form.minMemorySize) || 512) : 0,
                rawArgs: this.form.launchMode === 'raw' ? this.form.rawArgs : '',
                expireAt: this.toDbDateTime(this.form.expireAt)
            })
            if (res.data.code === 0) {
                this.tip(1, '新增实例成功')
                this.showAdd = false
                this.form = { name: '', javaPath: '', jarName: '', maxMemorySize: '', minMemorySize: '', launchMode: 'jar', rawArgs: '', expireAt: '' }
                this.loadInstances()
                this.loadJavaPaths()
            } else {
                this.tip(-1, res.data.msg)
            }
        },
        async delInstance (row) {
            this.$confirm('确认删除该实例及其文件？', '提示', { type: 'warning' }).then(async () => {
                let res = await this.post('wensc/deleteInstance', { instanceId: row.instance_id })
                if (res.data.code === 0) {
                    this.tip(1, '删除成功')
                    if (this.currentInstanceId == row.instance_id) this.$store.commit('SETINSTANCE', '')
                    this.loadInstances()
                } else {
                    this.tip(-1, res.data.msg)
                }
            }).catch(() => {})
        },
        async loadJavaPaths () {
            try {
                let res = await this.post('wensc/dict/list', { dictType: 'java_path' })
                if (res.data.code === 0) {
                    this.javaPaths = res.data.data || []
                }
            } catch (e) { /* 字典表可能尚未创建，忽略 */ }
        },
        openJavaPathDialog () {
            this.javaForm = { dictName: '', dictValue: '' }
            this.showJavaPath = true
        },
        async addJavaPath () {
            if (!this.javaForm.dictValue) {
                this.$message.warning('Java 路径必填')
                return
            }
            let res = await this.post('wensc/dict/add', {
                dictType: 'java_path',
                dictValue: this.javaForm.dictValue,
                dictName: this.javaForm.dictName || this.javaForm.dictValue
            })
            if (res.data.code === 0) {
                this.tip(1, '保存成功')
                this.showJavaPath = false
                await this.loadJavaPaths()
                this.form.javaPath = this.javaForm.dictValue
            } else {
                this.tip(-1, res.data.msg)
            }
        },
        async delJavaPath (dictId) {
            try {
                await this.$confirm('确认删除该 JAVA 路径配置？删除后引用它的实例将无法启动。', '提示', {
                    type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
                })
            } catch (e) { return }
            let res = await this.post('wensc/dict/delete', { dictId })
            if (res.data.code === 0) {
                this.tip(1, '删除成功')
                await this.loadJavaPaths()
                if (this.form.javaPath && !this.javaPaths.find(i => i.dict_value === this.form.javaPath)) {
                    this.form.javaPath = ''
                }
            } else {
                this.tip(-1, res.data.msg)
            }
        }
    },
    mounted () {
        this.loadInstances()
        this.loadJavaPaths()
    }
}
</script>
<style lang="less">
.service-page {
    padding: 12px;
    .list-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        .list-title { font-size: 16px; font-weight: 600; }
    }
    .card-wrap { margin-top: 4px; }
    .instance-card {
        margin-bottom: 16px;
        cursor: pointer;

        transition: all .2s;
        &.active {
            border-color: #409EFF;
            box-shadow: 0 0 0 2px rgba(64,158,255,.2);
        }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .name { font-weight: 600; }
        }
        .card-body .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3px 0;
            color: #606266;
            font-size: 13px;
            b { color: #303133; font-weight: 600; }
            .expire-due { color: #f56c6c; }
        }
    }
}
.add-instance-dialog {
    .el-dialog__header {
        border-bottom: 1px solid #ebeef5;
        padding-bottom: 12px;
    }
    .dialog-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        i { color: #409EFF; font-size: 18px; }
    }
    .el-dialog__body { padding: 14px 20px 6px; }
    .add-form {
        padding: 0;
        .el-form-item { margin-bottom: 12px; }
        .el-form-item__label {
            line-height: 1.2;
            padding-bottom: 6px;
        }
    }
    .launch-mode {
        width: 100%;
        display: flex;
        .el-radio-button { flex: 1; }
        .el-radio-button__inner { width: 100%; }
    }
    .mode-section {
        border: 1px solid #ebeef5;
        border-radius: 6px;
        padding: 12px 14px 0;
        margin-bottom: 12px;
    }
    .mode-tip { margin-bottom: 12px; }
    .mem-row {
        display: flex;
        gap: 12px;
    }
    .java-path-row {
        display: flex;
        gap: 8px;
        .el-select { flex: 1; }
    }
    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
}
</style>

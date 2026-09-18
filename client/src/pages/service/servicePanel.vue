<template>
    <div servicePanel>
        <el-collapse v-model="activeNames" @change="handleChange">
            <div class="service-control">
                <span class="title">服务器状态控制（{{ gameSetting.name || ('实例 #' + instanceId) }}）</span>
                <el-button icon="el-icon-back" @click="back" size="small">返回实例列表</el-button>
                <div class="btn-group">
                    <el-tag v-if="gameSetting.expireAt" :type="isExpired ? 'danger' : 'warning'" size="small" effect="plain" class="expire-tag">{{ isExpired ? '已过期' : '到期' }}：{{ gameSetting.expireAt }}</el-tag>
                    <el-button @click="startProcess" :disabled="$store.state.serverStatus != 0" type="primary" size="small" v-permission="'cmd.status.btn.start'">启动</el-button>
                    <el-button @click="stopProcess" :disabled="$store.state.serverStatus != 2" type="danger" size="small" v-permission="'cmd.status.btn.stop'">关闭</el-button>
                    <el-popconfirm
                        confirm-button-text='确定'
                        cancel-button-text='取消'
                        icon="el-icon-info"
                        icon-color="red"
                        @confirm="killProcess"
                        title="可能会造成游戏存档损坏，确定要强制关闭吗"
                    >
                        <el-button slot="reference" :disabled="$store.state.serverStatus == 0" size="small" v-permission="'cmd.status.btn.kill'">强制关闭</el-button>
                    </el-popconfirm>
                </div>
            </div>

            <el-collapse-item name="service">
                <template slot="title">
                    <i class="el-icon-setting"></i>
                    <span class="collapse-item-title">服务器操作</span>
                </template>
                <el-tabs type="border-card" v-model="activeTab" @tab-click="handleTabClick">
                    <el-tab-pane label="状态管理" name="status" v-if="hasPerm('cmd.tab.status')">
                        <div>
                            <el-button @click="closeTeamsFire" size="small">关闭队友伤害</el-button>
                            <el-button @click="openTeamsFire" size="small">开启队友伤害</el-button>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="坐标管理" name="location" v-if="hasPerm('cmd.tab.location')">
                        <el-form :inline="true" :model="recordInfo" class="demo-form-inline">
                            <el-form-item label="游戏ID">
                                <el-input v-model="recordInfo.playerId" placeholder="请输入需要传送的玩家游戏ID" size="small"></el-input>
                            </el-form-item>
                            <el-form-item label="坐标点名称：">
                                <el-input v-model="recordInfo.remark" placeholder="请输入地点备注名称" size="small"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="recordCoordinate" size="small">纪录</el-button>
                            </el-form-item>
                        </el-form>
                        <el-table :data="coordinateTable" stripe style="width: 100%" height="300">
                            <el-table-column prop="create_time" label="坐标名称" width="200">
                            </el-table-column>
                            <el-table-column prop="coordinate" label="坐标点">
                                <template slot-scope="scope">
                                    <el-tooltip placement="top">
                                        <div slot="content">点击复制</div>
                                        <span class="tag-read" :data-clipboard-text="copyText"
                                            @click="copy(coordinateTable[scope.$index].coordinate, coordinateTable[scope.$index].name)">{{ coordinateTable[scope.$index].coordinate }}</span>
                                    </el-tooltip>
                                </template>
                            </el-table-column>
                            <el-table-column prop="name" label="坐标名称" width="180">
                            </el-table-column>
                            <el-table-column prop="address" label="传送">
                                <template slot-scope="scope">
                                    <el-button @click="teleport(scope.$index, scope.row)" size="small" type="success">传送</el-button>
                                </template>
                            </el-table-column>
                            <el-table-column prop="delete" label="删除">
                                <template slot-scope="scope">
                                    <el-button @click="deleteLocation(scope.$index, scope.row)" size="small" type="danger">删除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                    <el-tab-pane label="配置管理" name="config" v-if="hasPerm('cmd.tab.config')">
                        <div class="config-tab-wrap">
                            <el-button class="history-fab" type="primary" circle icon="el-icon-time" title="历史实例配置" @click="historyVisible = !historyVisible"></el-button>
                            <transition name="el-fade-in">
                                <div v-if="historyVisible" class="history-panel">
                                    <div class="history-panel-header">
                                        <span>历史实例配置</span>
                                        <i class="el-icon-close" @click="historyVisible = false"></i>
                                    </div>
                                    <div v-if="disposeHistoryList.length === 0" class="history-empty">暂无历史配置</div>
                                    <ul v-else class="history-list">
                                        <li v-for="h in disposeHistoryList" :key="h.id" @click="onHistoryPick(h.id)">
                                            <span class="history-name">{{ h.name }}</span>
                                            <span class="history-time">{{ formatTime(h.update_time) }}</span>
                                            <i class="el-icon-delete history-del" title="删除该历史配置" @click.stop="onHistoryDelete(h.id)"></i>
                                        </li>
                                    </ul>
                                </div>
                            </transition>
                            <el-form :label-position="labelPosition" label-width="120px" :model="gameSetting">
                            <el-form-item label="JAVA路径" style="width: 80%;">
                                <div class="java-path-row">
                                    <el-select v-model="gameSetting.javaPath" placeholder="选择 / 输入 Java 路径" filterable allow-create default-first-option size="small" style="flex:1">
                                        <el-option v-for="item in javaPaths" :key="item.dict_id" :label="item.dict_name || item.dict_value" :value="item.dict_value">
                                            <div style="display:flex; align-items:center; width:100%;">
                                                <span style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ item.dict_name || item.dict_value }}</span>
                                                <span style="flex:1 1 auto; min-width:0; margin-left:8px; color:#8492a6; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ item.dict_value }}</span>
                                                <i class="el-icon-delete" v-permission="'javaPath.btn.delete'" style="flex:0 0 auto; margin-left:8px; color:#f56c6c; cursor:pointer;" title="删除该 JAVA 路径" @click.stop="delJavaPath(item.dict_id)"></i>
                                            </div>
                                        </el-option>
                                    </el-select>
                                    <el-button size="small" type="primary" icon="el-icon-plus" v-permission="'javaPath.btn.add'" @click="openJavaPathDialog">新建</el-button>
                                </div>
                            </el-form-item>
                            <el-form-item label="实例名称/目录">
                                <el-input v-model="gameSetting.name" size="small" placeholder="仅支持中文、字母、数字，作为实例目录名"></el-input>
                            </el-form-item>
                            <el-form-item label="到期时间" v-permission="'instance.btn.expire'">
                                <el-date-picker v-model="gameSetting.expireAt" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="为空表示不限制使用时间" size="small" style="width:100%"></el-date-picker>
                            </el-form-item>
                            <el-form-item label="启动模式">
                                <el-select v-model="gameSetting.launchMode" size="small" placeholder="选择启动模式" style="width:100%">
                                    <el-option label="java -jar（常规）" value="jar"></el-option>
                                    <el-option label="原始启动参数（自定义）" value="raw"></el-option>
                                </el-select>
                            </el-form-item>
                            <template v-if="gameSetting.launchMode === 'jar'">
                                <el-form-item label="服务端文件名">
                                    <el-input v-model="gameSetting.jarName" size="small"></el-input>
                                </el-form-item>
                                <el-form-item label="最小内存（m）">
                                    <el-input v-model="gameSetting.minMemorySize" size="small"></el-input>
                                </el-form-item>
                                <el-form-item label="最大内存（m）">
                                    <el-input v-model="gameSetting.maxMemorySize" size="small"></el-input>
                                </el-form-item>
                            </template>
                            <el-form-item v-else label="原始启动参数">
                                <el-input type="textarea" :rows="4" v-model="gameSetting.rawArgs" size="small" placeholder="填写 java 之后的完整参数，例如：-Xms2500M -Xmx4G @libraries/.../win_args.txt nogui"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button @click="updateSetting" type="primary" v-permission="'cmd.tab.config.btn.save'">保存</el-button>
                            </el-form-item>
                        </el-form>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="玩家存档" name="playerFiles" v-if="hasPerm('cmd.tab.playerFiles')">
                        <PlayerFiles ref="playerFiles"></PlayerFiles>
                    </el-tab-pane>
                    <el-tab-pane label="文件管理" name="fileManage" v-if="hasPerm('cmd.tab.fileManage')">
                        <FileManage ref="fileManage"></FileManage>
                    </el-tab-pane>
                </el-tabs>
            </el-collapse-item>
            <el-collapse-item name="players" class="players-collapse" v-if="hasPerm('cmd.tab.onlinePlayer')">
                <template slot="title">
                    <i class="el-icon-user"></i>
                    <span class="collapse-item-title">在线玩家</span>
                </template>
                <QuickOperation></QuickOperation>
            </el-collapse-item>
            <el-collapse-item name="console" v-if="hasPerm('cmd.tab.console')">
                <template slot="title">
                    <i class="el-icon-monitor"></i>
                    <span class="collapse-item-title">控制台</span>
                </template>
                <CmdPanel></CmdPanel>
            </el-collapse-item>
        </el-collapse>

        <el-dialog :visible.sync="showJavaPath" width="460px" :close-on-click-modal="false" title="新建 Java 路径" >
            <el-form :model="javaForm" label-position="top">
                <el-form-item label="名称" required>
                    <el-input v-model="javaForm.dictName" placeholder="如 JAVA17 / JDK21"></el-input>
                </el-form-item>
                <el-form-item label="Java 路径" required>
                    <el-input v-model="javaForm.dictValue" placeholder="java 可执行文件完整路径，如 D:\JAVA17\bin\java.exe"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer">
                <el-button @click="showJavaPath = false">取消</el-button>
                <el-button type="primary" @click="addJavaPath">保存</el-button>
            </span>
        </el-dialog>
    </div>
</template>
<script>
import PlayerFiles from '@/pages/playerFiles'
import FileManage from '@/pages/file'
import QuickOperation from '@/pages/service/quickOperation'
import CmdPanel from '@/pages/service/cmdPanel'
export default {
    components: {
        PlayerFiles,
        FileManage,
        QuickOperation,
        CmdPanel
    },
    data() {
        return {
            activeNames: ['service', 'players', 'console'],
            activeTab: 'status',
            recordInfo: {
                playerId: '',
                remark: ''
            },
            coordinateTable: [],
            labelPosition: 'right',
            gameSetting: {},
            javaPaths: [],
            disposeHistoryList: [],
            historyId: null,
            historyVisible: false,
            showJavaPath: false,
            javaForm: { dictName: '', dictValue: '' },
            copyText: '',
            timer: null
        }
    },
    computed: {
        instanceId() {
            return this.$store.state.currentInstanceId
        },
        isExpired() {
            if (!this.gameSetting.expireAt) return false
            const t = new Date(String(this.gameSetting.expireAt).replace(/-/g, '/')).getTime()
            return !isNaN(t) && t <= Date.now()
        }
    },
    methods: {
        back () {
            this.$router.push('/home/service')
        },
        copy(coor, name) {
            var clipboard = new this.Clipboard('.tag-read')
            this.copyText = `${coor.split(',').join(' ')} ${name}`
            clipboard.on('success', e => {
                this.tip(1, '复制成功')
                clipboard.destroy()
            })
            clipboard.on('error', e => {
                console.log('该浏览器不支持自动复制')
                clipboard.destroy()
            })
        },
        async updateSetting() {
            if (this.$store.state.serverStatus !== 0) {
                this.$message.error('请先停止实例后再保存配置')
                return
            }
            let res = await this.post('wensc/updateGameDispose', {
                instanceId: this.instanceId,
                name: this.gameSetting.name,
                gamePort: this.gameSetting.gamePort,
                playerNum: this.gameSetting.playerNum,
                minMemorySize: this.gameSetting.minMemorySize,
                maxMemorySize: this.gameSetting.maxMemorySize,
                jarName: this.gameSetting.jarName,
                javaPath: this.gameSetting.javaPath,
                javaDictId: (this.javaPaths.find(i => i.dict_value === this.gameSetting.javaPath) || {}).dict_id || this.gameSetting.javaDictId || '',
                launchMode: this.gameSetting.launchMode,
                rawArgs: this.gameSetting.rawArgs,
                expireAt: this.toDbDateTime(this.gameSetting.expireAt)
            })
            this.tip(res.data.code, res.data.msg)
        },
        async loadJavaPaths() {
            try {
                let res = await this.post('wensc/dict/list', { dictType: 'java_path' })
                if (res.data.code === 0) this.javaPaths = res.data.data || []
            } catch (e) { /* 字典表可能尚未创建，忽略 */ }
        },
        openJavaPathDialog() {
            this.javaForm = { dictName: '', dictValue: '' }
            this.showJavaPath = true
        },
        async addJavaPath() {
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
                this.gameSetting.javaPath = this.javaForm.dictValue
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
                // 若当前选中的正是被删除项，清空选择与已存字典 id
                if (this.gameSetting.javaPath && !this.javaPaths.find(i => i.dict_value === this.gameSetting.javaPath)) {
                    this.gameSetting.javaPath = ''
                    this.gameSetting.javaDictId = ''
                }
            } else {
                this.tip(-1, res.data.msg)
            }
        },
        async getGameDispose() {
            if (!this.instanceId) return
            let res = await this.post('wensc/getGameDispose', { instanceId: this.instanceId })
            if (res.data.code == 0) {
                const d = res.data.data
                this.historyId = null
                this.gameSetting = {
                    workPath: d.work_path,
                    name: d.name,
                    gamePort: d.game_port,
                    playerNum: d.max_players,
                    minMemorySize: d.min_memory_size,
                    maxMemorySize: d.max_memory_size,
                    jarName: d.jar_name,
                    javaPath: d.java_path,
                    javaDictId: d.java_dict_id,
                    launchMode: d.launch_mode,
                    rawArgs: d.raw_args,
                    expireAt: this.toDbDateTime(d.expire_at)
                }
                this.loadJavaPaths()
            }
        },
        async loadDisposeHistory() {
            try {
                let res = await this.post('wensc/disposeHistory/list', {})
                if (res.data.code === 0) this.disposeHistoryList = res.data.data || []
            } catch (e) { /* 历史表可能尚未创建，忽略 */ }
        },
        formatTime(val) {
            if (!val) return ''
            const d = new Date(val)
            if (isNaN(d.getTime())) return val
            const p = n => (n < 10 ? '0' + n : '' + n)
            return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
        },
        toDbDateTime(val) {
            if (!val) return null
            if (typeof val === 'string') return val
            if (val instanceof Date) {
                const p = n => (n < 10 ? '0' + n : '' + n)
                return val.getFullYear() + '-' + p(val.getMonth() + 1) + '-' + p(val.getDate()) + ' ' + p(val.getHours()) + ':' + p(val.getMinutes()) + ':' + p(val.getSeconds())
            }
            return null
        },
        async onHistoryDelete(id) {
            try {
                await this.$confirm('确认删除该历史实例配置？删除后无法恢复。', '提示', {
                    type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
                })
            } catch (e) { return }
            let res = await this.post('wensc/disposeHistory/delete', { id })
            if (res.data.code === 0) {
                this.$message.success('已删除历史配置')
                await this.loadDisposeHistory()
            } else {
                this.$message.error(res.data.msg)
            }
        },
        async onHistoryPick(id) {
            if (!id) return
            let res = await this.post('wensc/disposeHistory/detail', { id })
            if (res.data.code === 0) {
                const cfg = typeof res.data.data.config === 'string' ? JSON.parse(res.data.data.config) : (res.data.data.config || {})
                this.gameSetting = {
                    workPath: this.gameSetting.workPath,
                    name: cfg.name,
                    gamePort: cfg.gamePort,
                    playerNum: cfg.playerNum,
                    minMemorySize: cfg.minMemorySize,
                    maxMemorySize: cfg.maxMemorySize,
                    jarName: cfg.jarName,
                    javaPath: cfg.javaPath,
                    javaDictId: cfg.javaDictId,
                    launchMode: cfg.launchMode,
                    rawArgs: cfg.rawArgs,
                    expireAt: this.gameSetting.expireAt
                }
                await this.loadJavaPaths()
                this.historyVisible = false
                this.$message.success('已加载历史配置：' + (cfg.name || ''))
            } else {
                this.$message.error(res.data.msg)
            }
        },
        openTeamsFire() {
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: '/scoreboard teams option team friendlyFire true' })
            this.$notify({ title: '成功', message: '开启队伤成功', type: 'success' })
        },
        handleChange(val) {
            console.log(val)
        },
        // 切换 Tab 时，重新请求该 Tab 对应的接口，保证数据最新
        handleTabClick(tab) {
            const name = tab.name
            if (name === 'status') {
                this.getServerStatus()
            } else if (name === 'location') {
                this.getLocation()
            } else if (name === 'config') {
                this.getGameDispose()
                this.loadDisposeHistory()
            } else if (name === 'playerFiles' && this.$refs.playerFiles) {
                this.$refs.playerFiles.getPlayerFileList()
            } else if (name === 'fileManage' && this.$refs.fileManage) {
                this.$refs.fileManage.getFileTree()
            }
        },
        onSubmit() {
            console.log('submit!')
        },
        closeTeamsFire() {
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: '/scoreboard teams add team' })
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: '/scoreboard teams join team @a' })
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: '/scoreboard teams option team color aqua' })
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: '/scoreboard teams option team friendlyFire false' })
            this.$notify({ title: '成功', message: '关闭队伤成功', type: 'success' })
        },
        async getLocation() {
            let res = await this.post('wensc/getLocationList', { instanceId: this.instanceId })
            this.coordinateTable = res.data.data
        },
        async getServerStatus() {
            let res = await this.get('wensc/serverStatus', { instanceId: this.instanceId })
            if (res.data.code == 0) {
                this.$store.commit('SETSERVERSTATUS', res.data.data)
            }
        },
        recordCoordinate() {
            if (this.recordInfo.remark && this.recordInfo.playerId) {
                this.$store.commit('SETREBORNTYPE', 'record')
                this.$bus.$emit('record', this.recordInfo.playerId)
            } else {
                this.$notify.error({ title: '错误', message: '请输入坐标点名称' })
            }
        },
        teleport(index, row) {
            let position = ''
            row.coordinate.split(',').forEach((item, index) => {
                if (index != 1) position += item + ' '
            })
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: '/spreadplayers ' + position + '0 1 false ' + this.recordInfo.playerId })
            this.recordInfo.playerId = this.$store.getters.GETUSERINFO.player_id
        },
        async startProcess() {
            let res = await this.post('wensc/beginProcess', { instanceId: this.instanceId })
            if (res.data.code === 0) {
                this.$notify({ title: '成功', message: res.data.msg, type: 'success' })
            } else {
                this.$notify({ title: '失败', message: res.data.msg, type: 'error' })
            }
        },
        async stopProcess() {
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: '/stop' })
            this.$notify({ title: '成功', message: '已发送关闭指令', type: 'success' })
        },
        async killProcess() {
            let res = await this.post('wensc/killProcess', { instanceId: this.instanceId })
            this.$notify({ title: '成功', message: '已发送强制关闭指令', type: 'success' })
        },
        async deleteLocation(index, row) {
            let res = await this.post('wensc/deleteLocation', { instanceId: this.instanceId, locationId: row.location_id })
            if (res.data.code == 0) {
                this.$notify({ title: '成功', message: res.data.msg, type: 'success' })
                this.getLocation()
            }
        }
    },
    mounted() {
        this.getLocation()
        this.getServerStatus()
        this.recordInfo.playerId = this.$store.getters.GETUSERINFO.player_id
        this.getGameDispose()
    },
    watch: {
        '$store.state.userInfo'(val) {
            this.recordInfo.playerId = val.player_id
        },
        '$store.state.currentInstanceId'(val) {
            this.coordinateTable = []
            this.getLocation()
            this.getServerStatus()
            this.getGameDispose()
        },
        '$store.state.currentPosition'(val) {
            val.remarks = 2
            val.name = this.recordInfo.remark
            this.post('wensc/addLocation', { instanceId: this.instanceId, ...val }).then((res) => {
                if (res.status == 200 && res.data.code == 0) {
                    this.recordInfo.playerId = this.$store.getters.GETUSERINFO.player_id
                    this.getLocation()
                }
            })
        }
    }
}
</script>
<style lang="less">
div[servicePanel] {
    .el-form-item{
        margin-bottom: 15px;
    }
    .tag-read {
        cursor: pointer;
    }
    .java-path-row {
        display: flex;
        gap: 8px;
        .el-select { flex: 1; }
    }

    .config-tab-wrap {
        position: relative;
    }
    .history-fab {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 6;
    }
    .history-panel {
        position: absolute;
        top: 46px;
        right: 0;
        z-index: 7;
        width: 268px;
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.12);
        padding: 8px 0;
    }
    .history-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px 8px;
        font-weight: 600;
        border-bottom: 1px solid #f0f0f0;
        i {
            cursor: pointer;
            color: #909399;
            &:hover { color: #409EFF; }
        }
    }
    .history-empty {
        padding: 16px 12px;
        color: #909399;
        font-size: 13px;
        text-align: center;
    }
    .history-list {
        list-style: none;
        margin: 0;
        padding: 4px 0;
        max-height: 240px;
        overflow-y: auto;
        li {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            cursor: pointer;
            &:hover { background: #f5f7fa; }
            .history-name { font-weight: 500; }
            .history-time { color: #909399; font-size: 12px; margin-left: 8px; }
            .history-del {
                flex: 0 0 auto;
                margin-left: 10px;
                color: #f56c6c;
                cursor: pointer;
                &:hover { color: #e4393c; }
            }
        }
    }

    .service-control {
        padding: 15px 10px;
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(90deg, #eaf3ff 0%, #d6e8ff 100%);
        border-radius: 6px;
        &::after{
            position: absolute;
            display: block;
            bottom: 0;
            left: 0;
            height: 5px;
            width: 100%;
            animation:changeColor 5s infinite linear alternate;
            content: "";
        }
        @keyframes changeColor
        {
            20% { 
                background-color: red;
            }
            40% {
                background-color: green;
            }
            60% {
                background-color: pink;
            }
            80% {
                background-color: darkblue;
            }
            100% {
                background-color: orange;
            }
        }
        .title {
            font-weight: bold;
        }
        .btn-group {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 8px;
        }
    }

    .el-collapse-item__header{
        padding: 0 20px;
    }
    .el-collapse-item__content {
        padding-bottom: 0;
    }
    .el-tabs__content {
        max-height: 50vh;
        overflow-y: auto;
    }
    .el-collapse-item__header {
        font-weight: 600;
        background-color: #f5f7fa;
        i[class^="el-icon-"] {
            margin-right: 6px;
            font-size: 16px;
            color: #409EFF;
        }
    }
    .collapse-item-title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
    }
    .players-collapse {
        .el-collapse-item__content {
            max-height: 400px;
            overflow-y: auto;
        }
    }
}
</style>

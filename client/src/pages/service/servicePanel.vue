<template>
    <div servicePanel>
        <el-collapse v-model="activeNames" @change="handleChange">
            <div class="service-control">
                <span class="title">服务器状态控制</span>
                <div class="btn-group">
                    <el-button @click="startProcess" :disabled="serverStatus" type="primary" size="small">启动</el-button>
                    <el-button @click="stopProcess" :disabled="!serverStatus" type="danger" size="small">关闭</el-button>
                    <el-popconfirm
                        confirm-button-text='确定'
                        cancel-button-text='取消'
                        icon="el-icon-info"
                        icon-color="red"
                        @confirm="killProcess"
                        title="可能会造成游戏存档损坏，确定要强制关闭吗"
                    >
                        <el-button slot="reference" :disabled="!serverStatus" size="small">强制关闭</el-button>
                    </el-popconfirm>
                </div>
            </div>

            <el-collapse-item title="服务器操作" name="1">
                <el-tabs type="border-card">
                    <el-tab-pane label="状态管理">
                        <div>
                            <!-- <el-button>设立家的坐标点</el-button> -->
                            <el-button @click="closeTeamsFire" size="small">关闭队友伤害</el-button>
                            <el-button @click="openTeamsFire" size="small">开启队友伤害</el-button>
                        </div>
                    </el-tab-pane>
                    <!-- <el-tab-pane label="队伍管理">队伍管理</el-tab-pane> -->
                    <el-tab-pane label="坐标管理" v-if="checkEnabled('locationManage')">
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
                            <!-- <el-table-column
                            prop="coordinate"
                            label="坐标点"
                            width="180">
                            </el-table-column> -->
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
                            <!-- <el-table-column
                            prop="address"
                            label="选择玩家">
                            </el-table-column> -->
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
                    <el-tab-pane label="配置管理" v-if="checkEnabled('programManage')">
                        <el-form :label-position="labelPosition" label-width="120px" :model="gameSetting">
                            <!-- <el-form-item label="游戏端口">
                                <el-input v-model="gameSetting.gamePort"></el-input>
                            </el-form-item>
                            <el-form-item label="控制面板端口">
                                <el-input v-model="gameSetting.panelPort"></el-input>
                            </el-form-item>
                            <el-form-item label="玩家人数">
                                <el-input v-model="gameSetting.playerNum"></el-input>
                            </el-form-item> -->
                            <el-form-item label="JAVA路径">
                                <el-input v-model="gameSetting.javaPath" size="small"></el-input>
                            </el-form-item>
                            <el-form-item label="游戏目录">
                                <el-input v-model="gameSetting.workPath" size="small"></el-input>
                            </el-form-item>
                            <el-form-item label="服务端文件名">
                                <el-input v-model="gameSetting.jarName" size="small"></el-input>
                            </el-form-item>
                            <el-form-item label="最小内存（m）">
                                <el-input v-model="gameSetting.minMemorySize" size="small"></el-input>
                            </el-form-item>
                            <el-form-item label="最大内存（m）">
                                <el-input v-model="gameSetting.maxMemorySize" size="small"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <template slot-scope="scope">
                                    <el-button @click="updateSetting(scope.$index, scope.row)" type="primary">保存</el-button>
                                </template>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                </el-tabs>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>
<script>
export default {
    data() {
        return {
            activeNames: ['1'],
            recordInfo: {
                playerId: '',
                remark: ''
            },
            coordinateTable: [],
            labelPosition: 'right',
            gameSetting: {},
            serverStatus: true,
            copyText: ''
        }
    },
    methods: {
        copy(coor, name) {
            var clipboard = new this.Clipboard('.tag-read')
            this.copyText = `/teleport ${coor.split(',').join(' ')} ${name}`
            clipboard.on('success', e => {
                this.tip(1, '复制成功') // 这里你如果引入了elementui的提示就可以用，没有就注释即可
                // 释放内存
                clipboard.destroy()
            })
            clipboard.on('error', e => {
                // 不支持复制
                console.log('该浏览器不支持自动复制')
                // 释放内存
                clipboard.destroy()
            })
        },
        async updateSetting() {
            let res = await this.post('wensc/updateGameDispose', this.gameSetting)
            this.tip(res.data.code, res.data.msg)
        },
        async getGameDispose(index, item) {
            let res = await this.get('wensc/getGameDispose')
            if (res.data.code == 1) {
                this.gameSetting = {
                    workPath: res.data.data.work_path,
                    gamePort: res.data.data.game_port,
                    panelPort: res.data.data.panel_port,
                    playerNum: res.data.data.max_players,
                    gamplayerNumePort: res.data.data.game_port,
                    minMemorySize: res.data.data.min_memory_size,
                    maxMemorySize: res.data.data.max_memory_size,
                    jarName: res.data.data.jar_name,
                    javaPath: res.data.data.java_path
                }
            }
        },
        openTeamsFire() {
            this.$socket.emit('thread', '/scoreboard teams option team friendlyFire true')
            this.$notify({
                title: '成功',
                message: '开启队伤成功',
                type: 'success'
            })
        },
        handleChange(val) {
            console.log(val)
        },
        onSubmit() {
            console.log('submit!')
        },
        closeTeamsFire() {
            this.$socket.emit('thread', '/scoreboard teams add team')
            this.$socket.emit('thread', '/scoreboard teams join team @a')
            this.$socket.emit('thread', '/scoreboard teams option team color aqua')
            this.$socket.emit('thread', '/scoreboard teams option team friendlyFire false')
            this.$notify({
                title: '成功',
                message: '关闭队伤成功',
                type: 'success'
            })
        },
        async getLocation() {
            let res = await this.post('wensc/getLocationList', {})
            this.coordinateTable = res.data.data
        },
        async getServerStatus() {
            let res = await this.get('wensc/serverStatus', {})
            if (res.data.code == 1) {
                this.serverStatus = true
            } else {
                this.serverStatus = false
            }
        },
        recordCoordinate() { // 纪录当前坐标点
            if (this.recordInfo.remark && this.recordInfo.playerId) {
                this.$store.commit('SETREBORNTYPE', 'record')
                this.$bus.$emit('record', this.recordInfo.playerId)
            } else {
                this.$notify.error({
                    title: '错误',
                    message: '请输入坐标点名称'
                })
            }
        },
        teleport(index, row) {
            let position = ''
            row.coordinate.split(',').forEach((item, index) => {
                if (index != 1) position += item + ' '
            })
            this.$socket.emit('thread', '/spreadplayers ' + position + '0 1 false ' + this.recordInfo.playerId)
            this.recordInfo.playerId = this.$store.getters.GETUSERINFO.player_id
        },
        async startProcess() {
            let _this = this
            let res = await this.post('wensc/beginProcess', {})
            let timer = setInterval(() => {
                this.getServerStatus()
                if (_this.serverStatus) {
                    clearInterval(timer)
                    _this.serverStatus = true
                    this.$notify({
                        title: '成功',
                        message: res.data.msg,
                        type: 'success'
                    })
                }
            }, 1000)
        },
        async stopProcess() {
            let _this = this
            this.$socket.emit('thread', '/stop')
            let timer = setInterval(() => {
                _this.getServerStatus()
                if (!_this.serverStatus) {
                    clearInterval(timer)
                    _this.serverStatus = false
                    this.$notify({
                        title: '成功',
                        message: '成功关闭服务器',
                        type: 'success'
                    })
                }
            }, 1000)
        },
        async killProcess() {
            let _this = this
            let res = await this.post('wensc/killProcess', {})
            let timer = setInterval(() => {
                _this.getServerStatus()
                if (!_this.serverStatus) {
                    clearInterval(timer)
                    _this.serverStatus = false
                    this.$notify({
                        title: '成功',
                        message: res.data.msg,
                        type: 'success'
                    })
                }
            }, 1000)
        },
        async deleteLocation(index, row) {
            let res = await this.post('wensc/deleteLocation', { locationId: row.location_id })
            if (res.data.code == 1) {
                this.$notify({
                    title: '成功',
                    message: res.data.msg,
                    type: 'success'
                })
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
        '$store.state.currentPosition'(val) {
            val.remarks = 2
            val.name = this.recordInfo.remark
            this.post('wensc/addLocation', val).then((res) => {
                if (res.status == 200 && res.data.code == 1) {
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
    .tag-read {
        cursor: pointer;
    }

    .service-control {
        padding: 5px 10px;
        position: relative;
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
            padding: 10px;
            display: inline-block;
        }

        .btn-group {
            float: right;
        }

        &::after {
            content: "";
            display: block;
            clear: both;
        }
    }

    .el-collapse-item__header{
        padding: 0 20px;
    }
    .el-collapse-item__content {
        padding-bottom: 0;
    }
}
</style>
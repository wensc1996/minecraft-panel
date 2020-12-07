<template>
    <div servicePanel>
        <el-collapse v-model="activeNames" @change="handleChange">
            <div class="service-control">
                <span class="title">服务器状态控制</span>
                <div class="btn-group">
                    <el-button @click="startProcess" :disabled="serverStatus">启动</el-button>
                    <el-button>重启</el-button>
                    <el-button @click="closeProcess" :disabled="!serverStatus">关闭</el-button>
                </div>
            </div>

            <el-collapse-item title="服务器操作" name="1">
                <el-tabs type="border-card">
                    <el-tab-pane label="状态管理">
                        <div>
                            <el-button>设立家的坐标点</el-button>
                            <el-button @click="closeTeamsFire">关闭队友伤害</el-button>
                            <el-button @click="openTeamsFire">开启队友伤害</el-button>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="队伍管理">队伍管理</el-tab-pane>
                    <el-tab-pane label="坐标管理">
                        <el-form :inline="true" :model="recordInfo" class="demo-form-inline">
                            <el-form-item label="游戏ID">
                                <el-input v-model="recordInfo.playerId" placeholder="请输入需要传送的玩家游戏ID"></el-input>
                            </el-form-item>
                            <el-form-item label="坐标点名称：">
                                <el-input v-model="recordInfo.remark" placeholder="请输入地点备注名称"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="recordCoordinate">纪录</el-button>
                            </el-form-item>
                        </el-form>
                        <el-table
                            :data="coordinateTable"
                            stripe
                            style="width: 100%" height="300">
                            <el-table-column
                            prop="create_time"
                            label="坐标名称"
                            width="200">
                            </el-table-column>
                            <el-table-column
                            prop="coordinate"
                            label="坐标点"
                            width="180">
                            </el-table-column>
                            <el-table-column
                            prop="name"
                            label="坐标名称"
                            width="180">
                            </el-table-column>
                            <el-table-column
                            prop="address"
                            label="选择玩家">
                            </el-table-column>
                            <el-table-column
                            prop="address"
                            label="传送">
                            <template slot-scope="scope">
                                <el-button @click="teleport(scope.$index, scope.row)">传送</el-button>
                            </template>
                            </el-table-column>
                            <el-table-column
                            prop="delete"
                            label="删除">
                            <template slot-scope="scope">
                                <el-button @click="deleteLocation(scope.$index, scope.row)">删除</el-button>
                            </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                    <el-tab-pane label="配置管理">
                        <el-form :label-position="labelPosition" label-width="120px" :model="gameSetting">
                            <el-form-item label="游戏端口">
                                <el-input v-model="gameSetting.gamePort"></el-input>
                            </el-form-item>
                            <el-form-item label="控制面板端口">
                                <el-input v-model="gameSetting.panelPort"></el-input>
                            </el-form-item>
                            <el-form-item label="玩家人数">
                                <el-input v-model="gameSetting.playerNum"></el-input>
                            </el-form-item>
                            <el-form-item label="最小内存">
                                <el-input v-model="gameSetting.minMemory"></el-input>
                            </el-form-item>
                            <el-form-item label="最大内存">
                                <el-input v-model="gameSetting.maxMemory"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button>保存</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                    <el-tab-pane label="玩家存档上传" v-if="checkEnabled('uploadFile')">
                        <el-upload
                        :http-request="uploadFile"
                        class="upload-demo"
                        action="wensc/uploadFile"
                        :limit="1"
                        :file-list="fileList">
                        <el-button size="small" type="primary">点击上传</el-button>
                        <div slot="tip" class="el-upload__tip">只能上传.dat文件</div>
                        </el-upload>
                    </el-tab-pane>
                </el-tabs>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>
<script>
export default {
    data () {
        return {
            activeNames: ['1'],
            recordInfo: {
                playerId: '',
                remark: ''
            },
            coordinateTable: [],
            labelPosition: 'right',
            gameSetting: {
                gamePort: 25565,
                panelPort: 8080,
                playerNum: 20,
                minMemory: 1000,
                maxMemory: 4000
            },
            serverStatus: true,
            fileList: [],
            uploadForm: new FormData()
        }
    },
    methods: {
        checkEnabled(name) {
            if (this.$store.getters.GETPRIVILEGES.find(item => {
                if (item.menu_func_name == name) {
                    return true
                } else {
                    return false
                }
            })) {
                return true
            } else {
                return false
            }
        },
        async uploadFile(file) {
            let name = file.file.name
            if (name.substr(name.lastIndexOf('.') + 1) != 'dat') {
                this.$notify.error({
                    title: '错误',
                    message: '请上传.dat文件'
                })
                this.fileList = []
                return
            }
            this.uploadForm.append('files', file.file) // 上传的文件放在files里面了
            let res = await this.$axios({
                method: 'post',
                url: 'wensc/uploadFile',
                data: this.uploadForm
            })
            if (res.data.code == 1) {
                this.$notify({
                    title: '成功',
                    message: '上传玩家存档成功',
                    type: 'success'
                })
            }
            this.fileList = []
        },
        openTeamsFire() {
            this.$socket.emit('thread', '/scoreboard teams option team friendlyFire true')
            this.$notify({
                title: '成功',
                message: '开启队伤成功',
                type: 'success'
            })
        },
        handleChange (val) {
            console.log(val)
        },
        onSubmit () {
            console.log('submit!')
        },
        closeTeamsFire() {
            this.$socket.emit('thread', '/scoreboard teams add team')
            this.$socket.emit('thread', '/scoreboard teams join team @a')
            this.$socket.emit('thread', '/scoreboard teams option team color red')
            this.$socket.emit('thread', '/scoreboard teams option team friendlyFire false')
            this.$notify({
                title: '成功',
                message: '关闭队伤成功',
                type: 'success'
            })
        },
        async getLocation() {
            let res = await this.post('wensc/getLocationList', {userId: this.$store.getters.GETUSERINFO.user_id})
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
            this.$store.commit('SETREBORNTYPE', 'record')
            this.$bus.$emit('record', this.recordInfo.playerId)
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
            let res = await this.post('wensc/beginProcess', {})
            this.$notify({
                title: '成功',
                message: res.data.msg,
                type: 'success'
            })
        },
        async closeProcess() {
            let res = await this.post('wensc/killProcess', {})
            this.$notify({
                title: '成功',
                message: res.data.msg,
                type: 'success'
            })
        },
        async deleteLocation(index, row) {
            let res = await this.post('wensc/deleteLocation', {locationId: row.location_id})
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
    },
    watch: {
        'this.recordInfo.userId'(val) {
            console.log(val)
        },
        '$store.state.userInfo'(val) {
            this.recordInfo.playerId = val.player_id
        },
        '$store.state.currentPosition'(val) {
            val.remarks = 2
            val.name = this.recordInfo.remark
            if (val.name == '') {
                this.$notify.error({
                    title: '错误',
                    message: '请输入坐标点名称'
                })
            } else {
                val.userId = this.$store.getters.GETUSERINFO.user_id
                this.post('wensc/addLocation', val).then((res) => {
                    if (res.status == 200 && res.data.code == 1) {
                        this.recordInfo.playerId = this.$store.getters.GETUSERINFO.player_id
                        this.getLocation()
                    }
                })
            }
        }
    }
}
</script>
<style lang="scss">
    div[servicePanel]{
        .service-control{
            padding: 5px;
            .title{
                padding: 10px 20px;
                display: inline-block;
            }
            .btn-group{
                float: right;
            }
            &::after{
                content: "";
                display: block;
                clear: both;
            }
        }
        .el-collapse-item__content{
            padding-bottom: 0;
        }
    }
</style>
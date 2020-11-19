<template>
    <div servicePanel>
        <el-collapse v-model="activeNames" @change="handleChange">
            <div class="service-control">
                <span class="title">服务器状态控制</span>
                <div class="btn-group">
                    <el-button @click="startProcess">启动</el-button>
                    <el-button>重启</el-button>
                    <el-button @click="closeProcess">关闭</el-button>
                </div>
            </div>

            <el-collapse-item title="服务器操作" name="1">
                <el-tabs type="border-card">
                    <el-tab-pane label="状态管理">
                        <div>
                            <el-button>设立家的坐标点</el-button>
                            <el-button>关闭队友伤害</el-button>
                            <el-button>开启队友伤害</el-button>
                            <el-button @click="backupPlayers">存档</el-button>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="队伍管理">队伍管理</el-tab-pane>
                    <el-tab-pane label="坐标管理">
                        <el-form :inline="true" :model="formInline" class="demo-form-inline">
                            <el-form-item label="纪录当前坐标点：">
                                <el-input v-model="formInline.remark" placeholder="请输入地点备注名称"></el-input>
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
                        <el-form :label-position="labelPosition" label-width="120px" :model="formLabelAlign">
                            <el-form-item label="游戏端口">
                                <el-input v-model="formLabelAlign.name"></el-input>
                            </el-form-item>
                            <el-form-item label="控制面板端口">
                                <el-input v-model="formLabelAlign.name"></el-input>
                            </el-form-item>
                            <el-form-item label="玩家人数">
                                <el-input v-model="formLabelAlign.region"></el-input>
                            </el-form-item>
                            <el-form-item label="内存大小">
                                <el-input v-model="formLabelAlign.type"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button>保存</el-button>
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
    data () {
        return {
            activeNames: ['1'],
            formInline: {
                user: '',
                remark: ''
            },
            coordinateTable: [],
            labelPosition: 'right',
            formLabelAlign: {
                name: '',
                region: '',
                type: ''
            }
        }
    },
    methods: {
        handleChange (val) {
            console.log(val)
        },
        onSubmit () {
            console.log('submit!')
        },
        async getLocation() {
            let res = await this.post('wensc/getLocationList', {userId: 1001})
            this.coordinateTable = res.data.data
        },
        recordCoordinate() {
            this.$bus.$emit('record', '')
        },
        teleport(index, row) {
            let position = ''
            row.coordinate.split(',').forEach((item, index) => {
                if (index != 1) position += item + ' '
            })
            console.log('/spreadplayers ' + position + '0 1 false wensc')
            this.$socket.emit('thread', '/spreadplayers ' + position + '0 1 false wensc')
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
        async backupPlayers() {
            let res = await this.post('wensc/backupPlayer', {})
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
    },
    watch: {
        '$store.state.currentPosition'(val) {
            val.remarks = 2
            val.name = this.formInline.remark
            this.post('wensc/addLocation', val).then((res) => {
                if (res.status == 200 && res.data.code == 1) {
                    console.log(res.data.msg)
                    this.getLocation()
                }
            })
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
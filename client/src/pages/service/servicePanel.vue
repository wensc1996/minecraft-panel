<template>
    <div>
        <el-collapse v-model="activeNames" @change="handleChange">
            <div>服务器状态<el-button>启动</el-button><el-button>重启</el-button><el-button>关闭</el-button></div>
            <el-collapse-item title="服务器操作" name="1">
                <el-tabs type="border-card">
                    <el-tab-pane label="状态管理">
                        <div><el-button>设立家的坐标点</el-button><el-button>关闭队友伤害</el-button><el-button>开启队友伤害</el-button></div>
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
                            style="width: 100%">
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
            console.log(this.formInline.remark)
        }
    },
    mounted() {
        this.getLocation()
        this.$bus.$emit('record', '')
    }
}
</script>
<style lang="scss">
    .el-collapse-item__content{
        padding-bottom: 0;
    }
</style>
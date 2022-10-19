<template>
    <div logs>
        <el-table
        :data="logList"
        border
        style="width: 100%">
            <el-table-column
            prop="log_id"
            label="日志ID"
            >
            </el-table-column>
            <el-table-column
            prop="user_id"
            label="用户ID"
            >
            </el-table-column>
            <el-table-column
            prop="operation"
            label="操作"
            >
            </el-table-column>
            <el-table-column
            prop="op_time"
            label="操作时间"
            >
            </el-table-column>
            <el-table-column
                prop="operation"
                label="操作"
            >
                    <template slot-scope="scope">
                        <el-button @click="deleteLog(scope.row)" size="small">删除</el-button>
                    </template>
            </el-table-column>
        </el-table>
        <div class="page-nation">
            <el-pagination
                @current-change="resetPageSearch"
                @size-change="handleSizeChange"
                :current-page="current"
                background
                :page-size="pageSize"
                :page-sizes="[10, 20, 30, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="total">
            </el-pagination>
        </div>
    </div>
</template>
<script>
export default {
    components: {
    },
    data () {
        return {
            logList: [],
            total: 0,
            current: 1,
            pageSize: 10
        }
    },
    methods: {
        handleSizeChange(size) {
            this.current = 1,
            this.pageSize = size
            this.getLogList()
        },
        resetPageSearch(current) {
            this.current = current
            this.getLogList()
        },
        async getLogList() {
            let res = await this.post('wensc/getLogList', {
                current: this.current,
                pageSize: this.pageSize
            })
            if (res.data.code == 1) {
                this.logList = res.data.data.list
                this.total = res.data.data.total
            }
        },
        assignPrivilege(item) {
            this.roleId = item.role_id
            this.dialogVisible = true
        },
        closeAssignPrivilege() {
            this.dialogVisible = false
        },
        async deleteLog(row) {
            let res = await this.post('wensc/deleteLog', {
                logId: row.log_id
            })
            if (res.data.code == 1) {
                this.$notify({
                    title: '成功',
                    message: res.data.msg,
                    type: 'success'
                })
                this.current = 1
                this.getLogList()
            } else {
                this.$notify({
                    title: '失败',
                    message: res.data.msg,
                    type: 'error'
                })
            }
        }
    },
    mounted() {
        this.getLogList()
    }
}
</script>
<style lang="less">
    div[logs]{
        .page-nation{
            float: right;
        }
    }
</style>
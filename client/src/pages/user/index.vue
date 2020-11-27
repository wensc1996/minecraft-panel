<template>
  <div>
      <el-table
        :data="userList"
        border
        style="width: 100%">
        <el-table-column
        prop="user_id"
        label="用户ID">
        </el-table-column>
        <el-table-column
        prop="player_id"
        label="游戏ID">
        </el-table-column>
        <el-table-column
        prop="login_ip"
        label="登录IP">
        </el-table-column>
        <el-table-column
        prop="role"
        label="角色">
        </el-table-column>
        <el-table-column
        fixed="right"
        label="操作"
        width="180">
        <template slot-scope="scope">
            <el-button @click="handleClick(scope.row)" type="text" size="small">修改密码</el-button>
            <el-button type="text" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
        </el-table-column>
    </el-table>

    <el-dialog
    title="重置密码"
    :visible.sync="dialogVisible"
    width="30%" >
    <Repassword :userId="repasswordUserId" ref="repasswordModel"></Repassword>
    <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitRepassword">确 定</el-button>
    </span>
    </el-dialog>
  </div>
</template>

<script>
import Repassword from './repassword'
export default {
    data() {
        return {
            userList: [],
            dialogVisible: false,
            repasswordUserId: ''
        }
    },
    components: {
        Repassword
    },
    mounted() {
        this.getUserList()
    },
    methods: {
        async handleDelete(item) {
            this.$confirm('确认删除？', '提示').then((res) => {
                this.post('wensc/deleteUser', {
                    userId: item.user_id
                }).then(ress => {
                    if (res.data.code == 1) {
                        this.$notify({
                            title: '成功',
                            message: ress.data.msg,
                            type: 'success'
                        })
                    }
                })
            })
        },
        submitRepassword() {
            this.dialogVisible = false
            this.$refs.repasswordModel.submitRewritePassword()
        },
        handleClose(done) {
        },
        handleClick(row) {
            this.repasswordUserId = row.user_id
            this.dialogVisible = !this.dialogVisible
            console.log(row)
        },
        async getUserList() {
            let res = await this.get('wensc/getUserList', {})
            if (res.data.code == 1) {
                console.log(res.data.data)
                this.userList = res.data.data
            }
        }
    }
}
</script>
<style lang="sass">
</style>
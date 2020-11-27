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
        width="100">
        <template slot-scope="scope">
            <el-button @click="handleClick(scope.row)" type="text" size="small">查看</el-button>
            <el-button type="text" size="small">编辑</el-button>
        </template>
        </el-table-column>
    </el-table>

    <el-dialog
    title="提示"
    :visible.sync="dialogVisible"
    width="30%"
    :before-close="handleClose">
    <Repassword></Repassword>
    <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
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
            dialogVisible: false
        }
    },
    components: {
        Repassword
    },
    mounted() {
        this.getUserList()
    },
    methods: {
        handleClose(done) {
            this.$confirm('确认关闭？')
        },
        handleClick(row) {
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
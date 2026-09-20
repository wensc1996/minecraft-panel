<template>
  <div newUser>
       <div class="table-bar">
        <el-button type="primary" round @click="handleNewUser" v-if="checkEnabled('addNewUser')">新增用户</el-button>
      </div>
      <el-table
        :data="userList"
        border
        style="width: 100%">
        <el-table-column
        prop="user_id"
        label="用户ID">
        </el-table-column>
        <el-table-column
        prop="account"
        label="账户ID">
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
        width="250">
        <template slot-scope="scope">
            <el-button @click="handleClick(scope.row)" type="text" size="small" v-permission="'userManage.btn.changePassword'">修改密码</el-button>
            <el-button @click="updatePlayerId(scope.row)" type="text" size="small">修改游戏ID</el-button>
            <el-button type="text" size="small" @click="handleDelete(scope.row)" v-permission="'userManage.btn.delete'">删除</el-button>
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

    <el-dialog
        title="新增用户"
        :visible.sync="isShowNewUser"
        width="50%"
        :close-on-click-modal="false">
        <AddNewUser ref="addNewUser"></AddNewUser>
        <span slot="footer" class="dialog-footer">
            <el-button @click="isShowNewUser = false">取 消</el-button>
            <el-button type="primary" @click="submitAddNewUser">确 定</el-button>
        </span>
    </el-dialog>
  </div>
</template>

<script>
import Repassword from './repassword'
import AddNewUser from './addNewUser'
export default {
    data() {
        return {
            userList: [],
            dialogVisible: false,
            repasswordUserId: '',
            isShowNewUser: false
        }
    },
    components: {
        Repassword,
        AddNewUser
    },
    watch: {
        isShowNewUser(val) {
            if(val == false) {
                this.getUserList()
            }
        }
    },
    mounted() {
        this.getUserList()
    },
    methods: {
        updatePlayerId(item) {
            this.$prompt('请输入游戏ID', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputPattern: /\S/,
                inputErrorMessage: '游戏ID不能为空'
            }).then(async ({ value }) => {
                let res = await this.post('api/updatePlayerId', {
                    userId: item.user_id,
                    playerId: value
                })
                this.tip(res.data.code, res.data.msg)
                this.getUserList()
            }).catch(() => {
            })
        },
        submitAddNewUser() {
            this.$refs.addNewUser.submitNewUser()
            this.isShowNewUser = false
            this.getUserList()
        },
        handleNewUser() {
            this.isShowNewUser = true
        },
        async handleDelete(item) {
            let _this = this
            this.$confirm('确认删除？', '提示').then((res) => {
                this.post('api/deleteUser', {
                    userId: item.user_id
                }).then(ress => {
                    _this.tip(ress.data.code, ress.data.msg)
                    _this.getUserList()
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
        },
        async getUserList() {
            const info = this.$store.getters.GETUSERINFO
            const isPlatformAdmin = !!(info && info.isPlatformAdmin)
            const curTenant = (info && info.tenant_id) || 0
            const params = (isPlatformAdmin && curTenant) ? { tenantId: curTenant } : {}
            let res = await this.get('api/getUserList', params)
            if (res.data.code == 0) {
                this.userList = res.data.data
            }
        },
    }
}
</script>
<style lang="less">
    div[newUser]{
        .table-bar{
            display: flex;
            float: right;
            margin-bottom: 10px;
        }
    }
</style>
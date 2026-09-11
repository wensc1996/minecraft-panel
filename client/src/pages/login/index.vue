<template>
    <div login>
        <el-form label-position="left" label-width="80px" :model="accountInfo" class="account-form" @keyup.enter.native="submitLogin">
            <h3 class="login-title">我的世界服务器面板</h3>
            <el-form-item label="账号">
                <el-input v-model="accountInfo.account"></el-input>
            </el-form-item>
            <el-form-item label="密码">
                <el-input v-model="accountInfo.password" type="password" ></el-input>
            </el-form-item>
             <el-form-item>
                <el-button type="primary" @click="submitLogin">立即登录</el-button>
            </el-form-item>
        </el-form>
        <el-dialog title="选择登录分组" :visible.sync="dialogVisible" width="360px">
            <el-radio-group v-model="selectedTenantId">
                <el-radio v-for="t in tenantOptions" :key="t.tenant_id" :label="t.tenant_id" style="display:block;margin:8px 0;">{{ t.tenant_name }}</el-radio>
            </el-radio-group>
            <span slot="footer">
                <el-button type="primary" @click="confirmTenant">确定</el-button>
            </span>
        </el-dialog>
    </div>
</template>
<script>
export default {
    data () {
        return {
            accountInfo: {
                account: '',
                password: ''
            },
            dialogVisible: false,
            tenantOptions: [],
            selectedTenantId: ''
        }
    },
    mounted() {
    },
    methods: {
        async submitLogin() {
            let personInfo = await this.post('wensc/login', this.accountInfo)
            if (personInfo.data.code == 0) {
                this.afterLogin(personInfo.data.data)
            } else if (personInfo.data.code == 2) {
                // 账号跨多个租户，弹出选组
                this.tenantOptions = personInfo.data.data || []
                this.selectedTenantId = ''
                this.dialogVisible = true
            } else {
                this.$notify({
                    title: '失败',
                    message: personInfo.data.msg,
                    type: 'error'
                })
            }
        },
        async confirmTenant() {
            if (!this.selectedTenantId) {
                this.$message.warning('请选择分组')
                return
            }
            let personInfo = await this.post('wensc/login', {
                ...this.accountInfo,
                tenantId: this.selectedTenantId
            })
            if (personInfo.data.code == 0) {
                this.dialogVisible = false
                this.afterLogin(personInfo.data.data)
            } else {
                this.$notify({
                    title: '失败',
                    message: personInfo.data.msg,
                    type: 'error'
                })
            }
        },
        afterLogin(user) {
            this.$store.commit('SETUSERINFO', user)
            this.post('wensc/getRolePrivilege', { roleId: user.role_id }).then(privileges => {
                this.$store.commit('SETPRIVILEGES', privileges.data.data)
            })
            this.$router.push('/home/introduction')
        }
    }
}
</script>
<style lang = "less">
    div[login]{
        background: url('../../images/login-bg.jpg');
        background-repeat: no-repeat;
        background-size: cover;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 0 10%;
        .login-title{
            text-align: center;
            padding: 20px 0;
            color: #fff;
        }
        .account-form{
            border-radius: 10px;
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.7);
            width: 400px;
            .el-form-item__label{
                color: white
            }
            .el-input__inner{
                background-color: transparent;
                color: #fff;
            }
        }
    }
</style>

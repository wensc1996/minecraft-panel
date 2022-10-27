<template>
    <div login>
        <el-form label-position="left" label-width="80px" :model="accountInfo" class="account-form" @keyup.enter.native="submitLogin">
            <h3 class="login-title">我的世界服务器面板</h3>
            <el-form-item label="账号">
                <el-input v-model="accountInfo.userId"></el-input>
            </el-form-item>
            <el-form-item label="密码">
                <el-input v-model="accountInfo.password" type="password" ></el-input>
            </el-form-item>
             <el-form-item>
                <el-button type="primary" @click="submitLogin">立即登录</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
export default {
    data () {
        return {
            accountInfo: {
                userId: '',
                password: ''
            }
        }
    },
    mounted() {
    },
    methods: {
        async submitLogin() {
            let personInfo = await this.post('wensc/login', this.accountInfo)
            if (personInfo.data.code == 1) {
                this.$store.commit('SETUSERINFO', personInfo.data.data)
                let privileges = await this.post('wensc/getRolePrivilege', {
                    roleId: personInfo.data.data.role_id
                })
                this.$store.commit('SETPRIVILEGES', privileges.data.data)
                this.$router.push('/home/introduction')
            } else {
                this.$notify({
                    title: '失败',
                    message: personInfo.data.msg,
                    type: 'error'
                })
            }
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
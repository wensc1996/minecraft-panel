<!--
 * @Description: 登录页
 * @Version: 1.0
 * @Autor: niesc_SMEICS
 * @Date: 2020-12-15 14:56:50
 * @LastEditors: niesc_SMEICS
 * @LastEditTime: 2021-04-29 15:37:37
-->
<template>
    <div login>
        <el-form label-position="left" label-width="80px" :model="accountInfo" class="accountForm" @keyup.enter.native="submitLogin">
            <el-form-item>
                <h3>我的世界服务器面板</h3>
            </el-form-item>
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
<style lang = "sass">
    div[login]{
        /* background: url('../../images/login-bg.jpg'); */
        background-repeat: no-repeat;
        background-size: cover;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        .accountForm{
            border-radius: 10px;
            padding: 20px;
            background-color: rgb(124,203,79);
            width: 30%;
            .el-form-item__label{
                color: white
            }
        }
    }
</style>
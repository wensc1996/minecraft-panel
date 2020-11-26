<template>
    <div login>
        <el-form label-position="left" label-width="80px" :model="accountInfo" class="accountForm">
            <el-form-item>
                <h3>我的世界服务器面板</h3>
            </el-form-item>
            <el-form-item label="账号">
                <el-input v-model="accountInfo.userId"></el-input>
            </el-form-item>
            <el-form-item label="密码">
                <el-input v-model="accountInfo.password"></el-input>
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
    methods: {
        async submitLogin() {
            let res = await this.post('wensc/login', this.accountInfo)
            if (res.data.code == 1) {
                this.$router.push('/home/service')
            } else {
                this.$notify({
                    title: '失败',
                    message: res.data.msg,
                    type: 'error'
                })
            }
        }
    }
}
</script>
<style lang = "sass">
    div[login]{
        background-color: rgb(131,175,155);
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        .accountForm{
            border-radius: 10px;
            padding: 20px;
            background-color: rgba(252,157,154,0.5);
            width: 30%;
            .el-form-item__label{
                color: white
            }
        }
    }
</style>
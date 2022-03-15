<template>
    <div>
        <el-form :model="passwordForm" label-width="100px">
            <el-form-item label="旧密码">
                <el-input v-model="passwordForm.oldPassword" type="password"></el-input>
            </el-form-item>
            <el-form-item label="新密码">
                <el-input v-model="passwordForm.password" type="password"></el-input>
            </el-form-item>
            <el-form-item label="重复新密码">
                <el-input v-model="passwordForm.repassword" type="password"></el-input>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
export default {
    data() {
        return {
            passwordForm: {
                userId: '',
                oldPassword: '',
                password: '',
                repassword: ''
            }
        }
    },
    props: {
        userId: ''
    },
    mounted() {
        this.passwordForm.userId = this.userId
    },
    methods: {
        async submitRewritePassword() {
            if (this.passwordForm.repassword != this.passwordForm.password) {
                this.$notify({
                    title: '警告',
                    message: '两次密码不一致',
                    type: 'warning'
                })
            } else {
                let res = await this.post('wensc/updatePassword', this.passwordForm)
                if (res.data.code == 1) {
                    this.$notify({
                        title: '成功',
                        message: res.data.msg,
                        type: 'success'
                    })
                }
            }
        }
    }
}
</script>
<style lang="less">
</style>
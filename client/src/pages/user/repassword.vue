<template>
    <div>
        <el-form ref="form" :model="form" label-width="80px">
            <el-form-item label="旧密码">
                <el-input v-model="passwordForm.oldPassword"></el-input>
            </el-form-item>
            <el-form-item label="新密码">
                <el-input v-model="passwordForm.password"></el-input>
            </el-form-item>
            <el-form-item label="重复新密码">
                <el-input v-model="passwordForm.repassword"></el-input>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
export default {
    data() {
        return {
            passwordForm: {
                oldPassword: '',
                password: '',
                repassword: ''
            }
        }
    },
    methods: {
    }
}
</script>
<style lang="sass">
</style>
<template>
    <div>
        <el-form :model="newUser" label-width="100px">
            <el-form-item label="游戏ID">
                <el-input v-model="newUser.playerId" type="text"></el-input>
            </el-form-item>
            <el-form-item label="密码">
                <el-input v-model="newUser.password" type="password"></el-input>
            </el-form-item>
            <el-form-item label="用户角色">
                <el-select v-model="newUser.roleId" placeholder="请选择用户角色">
                    <el-option :label="item.role_name" :value="item.role_id" v-for="(item) in roleList" v-bind:key="item.role_id">{{item.role_name}}</el-option>
                </el-select>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
export default {
    data() {
        return {
            newUser: {
                playerId: '',
                password: '',
                roleId: ''
            },
            roleList: []
        }
    },
    created() {
        this.getRoleList()
    },
    methods: {
        async getRoleList() {
            let res = await this.get('wensc/getRoleList', {})
            this.roleList = res.data.data
        },
        async submitNewUser() {
            if (this.newUser.playerId == '') {
                this.tip(0, '请输入游戏ID')
                return
            }
            if (this.newUser.password == '' || this.newUser.length < 6) {
                this.tip(0, '请输入6位以上密码')
                return
            }
            if (this.newUser.roleId == '') {
                this.tip(0, '请选择用户角色')
                return
            }
            let res = await this.post('wensc/addNewUser', this.newUser)
            this.tip(res.data.code, res.data.msg)
        }
    }
}
</script>
<style lang="sass">
</style>
<template>
    <div>
        <el-form :model="newUser" label-width="100px">
            <el-form-item label="登录账号">
                <el-input v-model="newUser.account" type="text" placeholder="用于登录的账号"></el-input>
            </el-form-item>
            <el-form-item label="游戏ID">
                <el-input v-model="newUser.playerId" type="text"></el-input>
            </el-form-item>
            <el-form-item label="密码">
                <el-input v-model="newUser.password" type="password"></el-input>
            </el-form-item>
            <el-form-item label="所属租户" v-if="isPlatformAdmin">
                <el-select v-model="newUser.tenantId" placeholder="请选择租户（群组）" @change="onTenantChange">
                    <el-option :label="item.tenant_name" :value="item.tenant_id" v-for="(item) in tenantList" v-bind:key="item.tenant_id">{{item.tenant_name}}</el-option>
                </el-select>
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
    computed: {
        // 平台管理员(身份 isPlatformAdmin)可在新增用户时选择租户并分配到具体群组
        isPlatformAdmin() {
            const info = this.$store.getters.GETUSERINFO
            return !!(info && info.isPlatformAdmin)
        }
    },
    data() {
        return {
            newUser: {
                account: '',
                playerId: '',
                password: '',
                roleId: '',
                tenantId: ''
            },
            roleList: [],
            tenantList: []
        }
    },
    created() {
        if (this.isPlatformAdmin) {
            this.loadTenants()
        } else {
            this.getRoleList()
        }
    },
    methods: {
        async loadTenants() {
            let res = await this.get('wensc/tenants')
            if (res.data.code === 0) {
                this.tenantList = res.data.data || []
            }
        },
        async onTenantChange(tenantId) {
            this.newUser.roleId = ''
            this.roleList = []
            if (tenantId) {
                await this.getRoleList(tenantId)
            }
        },
        async getRoleList(tenantId) {
            const params = tenantId ? { tenantId } : {}
            let res = await this.get('wensc/getRoleList', params)
            this.roleList = res.data.data
        },
        async submitNewUser() {
            if (this.newUser.account == '') {
                this.tip(0, '请输入登录账号')
                return
            }
            if (this.newUser.playerId == '') {
                this.tip(0, '请输入游戏ID')
                return
            }
            if (this.newUser.password == '' || this.newUser.length < 6) {
                this.tip(0, '请输入6位以上密码')
                return
            }
            if (this.isPlatformAdmin && !this.newUser.tenantId) {
                this.tip(0, '请选择所属租户')
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
<style lang="less">
</style>
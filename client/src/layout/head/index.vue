<template>
    <div header>
        <div class="el-menu-demo row jc-sb ai-c">
            <h3>MCPANEL</h3>
            <div class="header-right">
                <el-select
                    v-if="isPlatformAdmin"
                    v-model="currentTenant"
                    size="small"
                    class="tenant-switch"
                    placeholder="切换租户"
                    @change="onSwitchTenant">
                    <el-option label="平台（默认）" :value="0"></el-option>
                    <el-option
                        v-for="t in tenantList"
                        :key="t.tenant_id"
                        :label="t.tenant_name + (t.status === 0 ? '（已停用）' : '')"
                        :value="t.tenant_id">
                    </el-option>
                </el-select>
                <span v-if="isPlatformAdmin" class="current-tenant-tip">当前：{{ currentTenantName }}</span>
                <user-center></user-center>
                <el-button @click="logout" class="logout-btn">退出登录</el-button>
            </div>
        </div>
    </div>
</template>
<script>
import userCenter from './userCenter'
export default {
    data () {
        return {
            tenantList: [],
            currentTenant: 0
        }
    },
    components: {
        userCenter
    },
    computed: {
        isPlatformAdmin() {
            const info = this.$store.getters.GETUSERINFO
            return !!(info && info.isPlatformAdmin)
        },
        currentTenantName() {
            if (this.currentTenant === 0) return '平台'
            const t = this.tenantList.find(x => x.tenant_id === this.currentTenant)
            return t ? t.tenant_name : ('租户#' + this.currentTenant)
        }
    },
    mounted() {
        const info = this.$store.getters.GETUSERINFO
        this.currentTenant = (info && info.tenant_id) || 0
        if (this.isPlatformAdmin) this.loadTenants()
    },
    methods: {
        async loadTenants() {
            try {
                const res = await this.get('api/tenants')
                if (res.data && res.data.code === 0) this.tenantList = res.data.data || []
            } catch (e) {}
        },
        async onSwitchTenant(val) {
            const res = await this.post('api/switchTenant', { tenantId: val })
            if (res.data && res.data.code === 0) {
                const info = this.$store.getters.GETUSERINFO
                info.tenant_id = Number(val)
                this.$store.commit('SETUSERINFO', info)
                // 切换作用域后重新拉取权限（平台管理员权限恒为全部），并清空当前实例态
                this.post('api/getRolePrivilege', { roleId: info.role_id }).then(privileges => {
                    this.$store.commit('SETPRIVILEGES', privileges.data.data)
                    this.$store.commit('SETINSTANCE', '')
                    this.$router.push('/home/introduction')
                    this.tip(0, val === 0 ? '已切换回平台' : '已切换到租户：' + this.currentTenantName)
                })
            } else {
                this.currentTenant = (this.$store.getters.GETUSERINFO.tenant_id) || 0
                this.tip(-1, (res.data && res.data.msg) || '切换租户失败')
            }
        },
        async logout() {
            let res = await this.post('api/logout', {})
            if(res.data.code == 0) {
                this.$router.push('/login')
            }
        }
    }
}
</script>
<style lang = "less">
div[header]{
    background-image: linear-gradient(to right, #10a8b3, #1E73A3);
    padding: 10px;
    .el-menu-demo{
        color: #fff;
        .header-right{
            display: flex;
            align-items: center;
            gap: 12px;
            .tenant-switch{
                width: 180px;
            }
            .current-tenant-tip{
                font-size: 13px;
                opacity: .9;
            }
            .logout-btn{
                color: #fff;
                background-color: transparent;
            }
        }
    }
}
</style>

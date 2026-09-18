<template>
    <div side-bar>
        <el-menu
        :default-active="activePath"
        class="el-menu-vertical-demo"
        @open="handleOpen"
        @close="handleClose"
        @select="handleSelect"
        router>
            <el-menu-item index="/home/introduction">
                <i class="el-icon-menu menu-icon"></i>
                <span slot="title">介绍</span>
            </el-menu-item>
            <el-menu-item index="/home/platform" v-if="isPlatformAdmin">
                <i class="el-icon-s-platform menu-icon"></i>
                <span slot="title">平台后台</span>
            </el-menu-item>
            <el-menu-item index="/home/service" v-if="checkEnabled('cmd')">
                <i class="el-icon-document menu-icon"></i>
                <span slot="title">控制面板</span>
            </el-menu-item>
            <el-menu-item index="/home/fileManage" v-if="checkEnabled('fileManage')">
                <i class="el-icon-folder menu-icon"></i>
                <span slot="title">文件管理</span>
            </el-menu-item>
            <el-menu-item index="/home/user" v-if="checkEnabled('userManage')">
                <i class="el-icon-setting menu-icon" ></i>
                <span slot="title">用户管理</span>
            </el-menu-item>
            <el-menu-item index="/home/roleManage" v-if="checkEnabled('roleManage')">
                <i class="el-icon-setting menu-icon"></i>
                <span slot="title">角色管理</span>
            </el-menu-item>
            <el-menu-item index="/home/logs" v-if="checkEnabled('logManage')">
                <i class="el-icon-document menu-icon"></i>
                <span slot="title">日志管理</span>
            </el-menu-item>
            <el-menu-item index="/home/nat-ddns" v-if="false">
                <i class="el-icon-setting menu-icon"></i>
                <span slot="title">内网穿透</span>
            </el-menu-item>
            <el-submenu index="4" v-if="false">
                <template slot="title">配置文件</template>
                <el-menu-item index="properties">server.properties</el-menu-item>
                <el-menu-item index="whitelist">whitelist.txt</el-menu-item>
                <el-menu-item index="ban-ips">ban-ips.txt</el-menu-item>
                <el-menu-item index="ban-payers">ban-payers.txt</el-menu-item>
            </el-submenu>
        </el-menu>
    </div>
</template>
<script>
export default {
    data() {
        return {
            activePath: '/home/introduction'
        }
    },
    computed: {
        // 平台管理员：基于登录身份(role_id=1 / isPlatformAdmin)，不受当前管理租户切换影响
        isPlatformAdmin() {
            const info = this.$store.getters.GETUSERINFO
            return !!(info && info.isPlatformAdmin)
        }
    },
    methods: {
        checkAdmin() {
            if (this.$store.getters.GETUSERINFO.role_id == 1) {
                return true
            } else {
                return false
            }
        },
        handleOpen (key, keyPath) {
        },
        handleClose (key, keyPath) {
        },
        handleSelect (key, keyPath) {
        }
    },
    mounted() {
        this.activePath = this.$route.path
    }
}
</script>
<style lang="less">
div[side-bar]{
    height: 100%;
    display: flex;
    flex-direction: column;

    .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 18px 20px;
        color: #fff;
        font-size: 17px;
        font-weight: 700;
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(255,255,255,.12);
        .brand-logo {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            background: rgba(255,255,255,.18);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
    }

    .el-menu {
        border-right: none;
        flex: 1;
        padding: 8px;
        background-color: transparent;
    }
    .el-menu-item {
        position: relative;
        height: 46px;
        line-height: 46px;
        margin: 4px 0;
        border-radius: 8px;
        color: rgba(255,255,255,.82);
        border: none;
        background-color: transparent;
        transition: all .2s;
        .menu-icon {
            color: rgba(255,255,255,.65);
            transition: all .2s;
        }
        &:focus {
            background-color: transparent;
            outline: none;
        }
        &:hover {
            background: rgba(64, 158, 255, .22);
            color: #fff;
            .menu-icon { color: #fff; }
        }
        &.is-active {
            background: rgba(255,255,255,.22);
            color: #fff;
            font-weight: 600;
            .menu-icon { color: #fff; }
            &::before {
                content: "";
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 22px;
                border-radius: 0 4px 4px 0;
                background: #fff;
            }
        }
    }
}
</style>

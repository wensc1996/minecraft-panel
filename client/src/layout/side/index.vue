<template>
    <div side-bar>
        <el-menu
        :default-active="activePath"
        class="el-menu-vertical-demo"
        @open="handleOpen"
        @close="handleClose"
        @select="handleSelect"
        background-color="transparent"
        text-color="#fff"
        active-text-color="#111b20" 
        router>
            <el-menu-item index="/home/introduction">
                <i class="el-icon-menu menu-icon"></i>
                <span slot="title">介绍</span>
            </el-menu-item>
            <el-menu-item index="/home/service" v-if="checkEnabled('cmd')">
                <i class="el-icon-document menu-icon"></i>
                <span slot="title">控制面板</span>
            </el-menu-item>
            <el-menu-item index="/home/playerFiles" v-if="checkEnabled('playerFiles')">
                <i class="el-icon-document menu-icon"></i>
                <span slot="title">玩家存档</span>
            </el-menu-item>
            <el-menu-item index="/home/user" v-if="checkEnabled('userManage')">
                <i class="el-icon-setting menu-icon" ></i>
                <span slot="title">用户管理</span>
            </el-menu-item>
            <el-menu-item index="/home/roleManage" v-if="checkEnabled('roleManage')">
                <i class="el-icon-setting menu-icon"></i>
                <span slot="title">角色管理</span>
            </el-menu-item>
            <el-menu-item index="/home/file" v-if="checkEnabled('uploadFile')">
                <i class="el-icon-document menu-icon"></i>
                <span slot="title">文件管理</span>
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
    // min-height: 100vh;
    // height: calc(100% - 100px);
    .el-menu-item{
        border-bottom: 1px solid #a7a2a2;
        .menu-icon{
            color: aqua;
        }
    }
}
</style>
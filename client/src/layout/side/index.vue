<!--
 * @Description: 侧边栏
 * @Version: 1.0
 * @Autor: niesc_SMEICS
 * @Date: 2020-12-07 13:48:37
 * @LastEditors: niesc_SMEICS
 * @LastEditTime: 2021-04-29 15:32:43
-->
<template>
    <div side-bar>
        <el-menu
        default-active="/home/introduction"
        class="el-menu-vertical-demo"
        @open="handleOpen"
        @close="handleClose"
        @select="handleSelect"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b" router>
            <el-menu-item index="/home/introduction">
                <i class="el-icon-menu"></i>
                <span slot="title">介绍</span>
            </el-menu-item>
            <el-menu-item index="/home/service" v-if="checkEnabled('cmd')">
                <i class="el-icon-document"></i>
                <span slot="title">控制面板</span>
            </el-menu-item>
            <el-menu-item index="/home/user" v-if="checkEnabled('userManage')">
                <i class="el-icon-setting" ></i>
                <span slot="title">用户管理</span>
            </el-menu-item>
            <el-menu-item index="/home/roleManage" v-if="checkEnabled('roleManage')">
                <i class="el-icon-setting"></i>
                <span slot="title">角色管理</span>
            </el-menu-item>
            <el-menu-item index="/home/file">
                <i class="el-icon-document"></i>
                <span slot="title">文件管理</span>
            </el-menu-item>
            <el-menu-item index="/home/nat-ddns" v-if="false">
                <i class="el-icon-setting"></i>
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
    }
}
</script>
<style lang="scss">
div[side-bar]{
    min-height: 100vh;
    height: 100%;
    background: gainsboro;
}
</style>
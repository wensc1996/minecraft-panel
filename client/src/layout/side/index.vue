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
            <el-menu-item index="/home/service">
                <i class="el-icon-document"></i>
                <span slot="title">控制面板</span>
            </el-menu-item>
            <el-menu-item index="/home/file">
                <i class="el-icon-document"></i>
                <span slot="title">文件管理</span>
            </el-menu-item>
            <el-menu-item index="3">
                <i class="el-icon-setting"></i>
                <span slot="title">用户</span>
            </el-menu-item>
            <el-menu-item index="/home/nat-ddns">
                <i class="el-icon-setting"></i>
                <span slot="title">内网穿透</span>
            </el-menu-item>
            <el-submenu index="4">
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
        handleOpen (key, keyPath) {
            console.log(key, keyPath)
        },
        handleClose (key, keyPath) {
            console.log(key, keyPath)
        },
        handleSelect (key, keyPath) {
        }
    }
}
</script>
<style lang="scss">
div[side-bar]{
    height: 100vh;
    background: gainsboro;
}
</style>
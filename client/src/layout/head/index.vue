<!--
 * @Description: head
 * @Version: 1.0
 * @Autor: niesc_SMEICS
 * @Date: 2020-11-16 17:44:04
 * @LastEditors: niesc_SMEICS
 * @LastEditTime: 2021-04-29 15:35:05
-->
<template>
    <div header class="clear-fix">
        <el-menu
        :default-active="activeIndex2"
        class="el-menu-demo"
        mode="horizontal"
        @select="handleSelect"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b">
        <el-menu-item index="1" @click="logout">退出登录</el-menu-item>
            <!-- <el-submenu index="2">
                <template slot="title">我的工作台</template>
                    <el-menu-item index="2-1">选项1</el-menu-item>
                    <el-menu-item index="2-2">选项2</el-menu-item>
                    <el-menu-item index="2-3">选项3</el-menu-item>
                <el-submenu index="2-4">
                <template slot="title">选项4</template>
                    <el-menu-item index="2-4-1">选项1</el-menu-item>
                    <el-menu-item index="2-4-2">选项2</el-menu-item>
                    <el-menu-item index="2-4-3">选项3</el-menu-item>
                </el-submenu>
            </el-submenu> -->
            <!-- <el-menu-item index="3"></el-menu-item> -->
        </el-menu>
    </div>
</template>
<script>
export default {
    data () {
        return {
            activeIndex: '1',
            activeIndex2: '1'
        }
    },
    methods: {
        handleSelect (key, keyPath) {
            console.log(key, keyPath)
        },
        logout() {
            this.$router.push('/login')
        }
    }
}
</script>
<style lang="scss">
div[header]{
    background-color: rgb(84, 92, 100);
    ul{
        display: inline;
        float: right;
    }
}
</style>
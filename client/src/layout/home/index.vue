<template>
    <div>
        <el-container>
            <el-header><Header></Header></el-header>
            <el-container>
                <el-aside><SideMenu></SideMenu></el-aside>
                <el-main>
                    <router-view></router-view>
                </el-main>
            </el-container>
            <el-footer>3</el-footer>
        </el-container>
    </div>
</template>
<script>
import Header from '@/layout/head'
import SideMenu from '@/layout/side'
export default {
    components: {
        Header,
        SideMenu
    },
    computed: {
        getRouteName () {
            return this.$route.name
        }
    }
}
</script>
<style lang="scss">
</style>
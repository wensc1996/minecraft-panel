<template>
    <div controlPanel>
        <el-container>
            <el-header><Header></Header></el-header>
            <el-container>
                <el-aside><SideMenu></SideMenu></el-aside>
                <el-main>
                    <router-view></router-view>
                </el-main>
            </el-container>
            <el-footer><Footer></Footer></el-footer>
        </el-container>
    </div>
</template>
<script>
import Header from '@/layout/head'
import SideMenu from '@/layout/side'
import Footer from '@/layout/foot'
export default {
    components: {
        Header,
        SideMenu,
        Footer
    },
    computed: {
        getRouteName () {
            return this.$route.name
        }
    }
}
</script>
<style lang="scss">
    div[controlPanel]{
        .el-container{
            height: 90.2vh;
        }
    }
</style>
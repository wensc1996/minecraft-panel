<template>
    <div controlPanel>
        <el-container class="view col overflow-y-h">
            <el-header>
                <Header></Header>
            </el-header>
            <el-container class="flex row overflow-y-h">
                <el-aside style="height: 100%;">
                    <SideMenu></SideMenu>
                </el-aside>
                <el-main class="overflow-y">
                    <router-view></router-view>
                </el-main>
            </el-container>
            <el-footer style="height: initial;">
                <Footer></Footer>
            </el-footer>
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
    },
    beforeCreate() {
        if (Object.keys(this.$store.getters.GETUSERINFO).length == 0) {
            this.$router.push('/login')
        }
    }
}
</script>
<style lang="less">
div[controlPanel]{
    .el-header{
        box-shadow: -8px 2px 6px 3px #cbcbcb;
    }
    .el-aside{
        background-image: linear-gradient(to top, #10a8b3, #1E73A3);
    }
    .el-main{
        padding: 10px;
    }
}
</style>
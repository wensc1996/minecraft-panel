<template>
    <div header>
        <div class="el-menu-demo row jc-sb ai-c">
            <h3>MCPANEL</h3>
            <el-button @click="logout" class="logout-btn">退出登录</el-button>
        </div>
    </div>
</template>
<script>
export default {
    data () {
        return {
        }
    },
    methods: {
        async logout() {
            let res = await this.post('wensc/logout', {})
            if(res.data.code == 1) {
                this.$router.push('/login')
            }
        }
    }
}
</script>
<style lang="less">
div[header]{
    background-image: linear-gradient(to right, #10a8b3, #1E73A3);
    padding: 10px;
    .el-menu-demo{
        color: #fff;
        .logout-btn{
            color: #fff;
            background-color: transparent;
        }
    }
}
</style>
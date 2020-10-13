<template>
    <div class="container">
        <h3>服务器面板</h3>
    </div>
</template>
<script>
export default {
    mounted () {
        this.$axios.get('/wensc/index').then((res) => {
            console.log(res.data)
        })
    }
}
</script>
<style lang="scss">
</style>
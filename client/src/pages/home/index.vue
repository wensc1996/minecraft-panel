<template>
    <div class="content">
        <div class="quick panel-block">
            1
        </div>
        <div class="log panel-block">2</div>
        <div class="command panel-block">3</div>
        <el-radio v-model="radio" label="1">备选项</el-radio>
        <el-radio v-model="radio" label="2">备选项</el-radio>
    </div>
</template>
<script>
export default {
    data () {
        return {
            radio: '1'
        }
    }
}
</script>
<style lang="scss">
</style>
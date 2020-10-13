<template>
    <div cmd-panel>
        <div class="cmd">
            <div style="margin-top: 15px;">
                <el-input placeholder="请输入指令" v-model="cmd">
                    <template slot="append"><el-button>执行</el-button></template>
                </el-input>
            </div>
        </div>
        <div class="panel">
            <div class="line">[Server] 2020-10-10 9:39 Ooze hurt player wensc 1 vs 17 protection, result in 16.0 to 16.0</div>
            <div class="line">[Server] 2020-10-10 9:39 Ooze hurt player wensc 1 vs 17 protection, result in 16.0 to 16.0</div>
        </div>
    </div>
</template>
<script>
export default {
    data () {
        return {
            cmd: ''
        }
    }
}
</script>
<style lang="scss">
    div[cmd-panel]{
        .panel{
            padding: 1em;
        }
    }
</style>
<template>
    <div cmd-panel>
        <div class="cmd">
            <div style="margin-top: 15px;">
                <el-input placeholder="请输入指令" v-model="cmd">
                    <template slot="append"><el-button @click="actCMD">执行</el-button></template>
                </el-input>
            </div>
        </div>
        <div class="panel">
            <div v-for="(item, index) in msgContainer" :key="index" class="line">{{item}}</div>
        </div>
    </div>
</template>
<script>
export default {
    data () {
        return {
            cmd: '',
            msgContainer: [],
            id: ''
        }
    },
    mounted () {
        // this.$store.commit('increment')
        // console.log(this.$store.getters.optCount)
        this.listPlayers()
    },
    sockets: {
        // 这里是监听connect事件
        connect: function () {
            // 接收服务端发来的推送
            this.id = this.$socket.id
        },
        // 方法名与服务端的保持一致
        res: function (res) {
        // 以下对接收来的数据进行操作
            console.log(res)
            this.msgContainer.push(res)
        }
    },
    methods: {
        actCMD () {
            console.log(this.cmd)
            this.$socket.emit('thread', this.cmd)
        },
        resultFilter(res) {

        },
        listPlayers() {
            this.$socket.emit('thread', '/list')
        }
    }
}
</script>
<style lang="scss">
    div[cmd-panel]{
        .panel{
            height: 600px;
            overflow-y: scroll;
            padding: 1em;
            .line{
                padding: 5px 0;
            }
        }
    }
</style>
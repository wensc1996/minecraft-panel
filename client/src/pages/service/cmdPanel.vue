<template>
    <div cmd-panel>
        <div class="cmd">
            <div style="margin-top: 15px;">
                <el-input placeholder="请输入指令" v-model="cmd" @keyup.enter.native="actCMD">
                    <template slot="append">
                        <el-button @click="actCMD">执行</el-button>
                    </template>
                </el-input>
            </div>
        </div>
        <div class="panel">
            <div v-for="(item, index) in msgContainer" :key="index" class="line">{{ item }}</div>
        </div>
    </div>
</template>
<script>
export default {
    data() {
        return {
            cmd: '',
            msgContainer: [],
            id: '',
            isAskedPlayer: false,
            players: [],
            timer: null
        }
    },
    mounted() {
        // this.$store.commit('increment')
        // console.log(this.$store.getters.optCount)
        // this.listPlayers()
    },
    sockets: {
        // 这里是监听connect事件
        connect: function () {
            // 接收服务端发来的推送
            this.id = this.$socket.id
        },
        // 方法名与服务端的保持一致
        wensc: function (res) {
            // 以下对接收来的数据进行操作
            this.resultFilter(res)
        }
    },
    methods: {
        joinRoom() {
            this.$socket.emit('joinRoom', '')
        },
        actCMD() {
            this.$socket.emit('thread', this.cmd)
        },
        trimBlank(str) {
            return str.replace(/[\n\r\s]/g, '')
        },
        resultFilter(res) {
            if (res.type == 'playerList') {
                this.$store.commit('SETPLAYERS', res.data.map(item => {
                    return {
                        name: item
                    }
                }))
            } else if(res.type == 'serverStatus') {
                this.$store.commit('SETSERVERSTATUS', res.data)
            } else if(res.type == 'spawnPoint') {
                if (this.$store.state.rebornType == 'record') {
                    this.$store.commit('SETCURRENTPOSITION', res.data)
                    this.$store.state.rebornType = ''
                }
                this.$notify({
                    title: '成功',
                    message: '重生/定位成功',
                    type: 'success'
                })
            } else if(res.type == 'notFound') {
                this.$notify.error({
                    title: '错误',
                    message: '当前用户不在线或不存在'
                })
            } else {
                if(Array.isArray(res.data)) {
                    if (this.msgContainer.length > 20) {
                        this.msgContainer.splice(-1, res.data.length)
                    }
                    this.msgContainer.unshift(...res.data)
                } else {
                    if (this.msgContainer.length > 20) {
                        this.msgContainer.pop()
                    }
                    this.msgContainer.unshift(res.data)
                }
            }
        },
        listPlayers() {
            this.$socket.emit('thread', '/list')
        },
        recordPlayer(val) {
            this.$socket.emit('thread', '/spawnpoint ' + val)
        }
    },
    created() {
        this.joinRoom()
        this.$bus.$on('record', (val) => {
            this.recordPlayer(val)
        })
    },
    beforeRouteLeave(to, from, next) {
        this.$bus.$off('record')
    },
    beforeDestroy() {
        this.$bus.$off('record')
    }
}
</script>
<style lang="less">
div[cmd-panel] {
    .panel {
        height: 600px;
        overflow-y: scroll;
        padding: 1em;

        .line {
            padding: 5px 0;
        }
    }
}
</style>
<template>
    <div cmd-panel>
        <div class="cmd">
            <div style="margin-top: 15px;">
                <el-input placeholder="请输入指令" v-model="cmd" @keyup.enter.native="actCMD">
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
            id: '',
            isAskedPlayer: false,
            players: [],
            timer: null
        }
    },
    mounted () {
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
        joinRoom () {
            this.$socket.emit('thread', '')
        },
        actCMD () {
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
            } else {
                res = res.data
                if (/Set \S+ spawn point to|将(\S+)的出生点设置到/.test(res)) {
                    this.$notify({
                        title: '成功',
                        message: '重生/定位成功',
                        type: 'success'
                    })
                    if (this.$store.state.rebornType == 'record') {
                        let playerIdArr = res.match(/Set (\S+)'s spawn point to|将(\S+)的出生点设置到/)
                        let playerId = ''
                        let coordinate = ''
                        if(playerIdArr[1]) {
                            playerId = playerIdArr[1]
                            coordinate = this.trimBlank(res.match(/(-?\d+, -?\d+, -?\d+)/)[1])
                        } else {
                            playerId = playerIdArr[2]
                            coordinate = this.trimBlank(res.match(/(-?\d+，-?\d+，-?\d+)/)[1]).replace(/，/g, ',')
                        }
                        this.$store.commit('SETCURRENTPOSITION', {playerId, coordinate})
                    }
                }
                // if (/(\S+ joined the game)/.test(res)) { // |(\S+ left the game)
                //     this.listPlayers()
                // }
                if (/That player cannot be found/.test(res)) { // |(\S+ left the game)
                    this.$notify.error({
                        title: '错误',
                        message: '当前用户不在线或不存在'
                    })
                }

                if (this.msgContainer.length > 20) this.msgContainer.pop()
                this.msgContainer.unshift(res)
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
    beforeRouteLeave (to, from, next) {
        this.$bus.$off('record')
    },
    beforeDestroy() {
        this.$bus.$off('record')
    },
}
</script>
<style lang="less">
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
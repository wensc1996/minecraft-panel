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
            players: [],
            timer: null
        }
    },
    computed: {
        instanceId() {
            return this.$store.state.currentInstanceId
        }
    },
    sockets: {
        connect: function () {
            this.id = this.$socket.id
        },
        wensc: function (res) {
            this.resultFilter(res)
        }
    },
    methods: {
        joinRoom() {
            this.$socket.emit('joinRoom', { instanceId: this.instanceId })
        },
        actCMD() {
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: this.cmd })
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
                if (Array.isArray(res.data)) {
                    this.msgContainer.unshift(...res.data)
                } else {
                    this.msgContainer.unshift(res.data)
                }
                if (this.msgContainer.length > 100) {
                    this.msgContainer.length = 100
                }
            }
        },
        listPlayers() {
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: '/list' })
        },
        recordPlayer(val) {
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: '/spawnpoint ' + val })
        }
    },
    created() {
        if (this.instanceId) this.joinRoom()
        this.$bus.$on('record', (val) => {
            this.recordPlayer(val)
        })
    },
    watch: {
        '$store.state.currentInstanceId'(val) {
            this.msgContainer = []
            this.joinRoom()
        }
    },
    beforeDestroy() {
        this.$bus.$off('record')
    }
}
</script>
<style lang="less">
div[cmd-panel] {
    .cmd {
        margin-bottom: 10px;
    }
    .panel {
        height: 600px;
        overflow-y: auto;
        padding: 10px 12px;
        border: 1px solid #dcdfe6;
        border-radius: 6px;
        background-color: #fafafa;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #303133;

        .line {
            padding: 4px 8px;
            border-radius: 4px;
            white-space: pre-wrap;
            word-break: break-all;

            &:nth-child(odd) {
                background-color: #f0f2f5;
            }
        }
    }
}
</style>

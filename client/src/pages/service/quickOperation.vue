<template>
    <div quickOperation>
        <el-table border :row-class-name="tableRowClassName"
            :data="players">
            <el-table-column
            prop='name'
            label="玩家">
            </el-table-column>
            <el-table-column
            prop="kick"
            label="踢出服务器">
                <template slot-scope="scope">
                    <el-button @click="kickPlayer(scope.$index, scope.row)" size="small" v-permission="'cmd.onlinePlayer.btn.kick'">踢出</el-button>
                </template>
            </el-table-column>
            <el-table-column
            prop="random"
            label="随机传送">
                <template slot-scope="scope">
                    <el-button @click="randomTeleport(scope.$index, scope.row)" size="small" v-permission="'cmd.onlinePlayer.btn.randomTeleport'">随机传送</el-button>
                </template>
            </el-table-column>
            <el-table-column
            prop="reborn"
            label="重生">
                <template slot-scope="scope">
                    <el-button @click="reborn(scope.$index, scope.row)" type="primary" size="small" v-permission="'cmd.onlinePlayer.btn.reborn'">重生</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script>
export default {
    data() {
        return {
            players: []
        }
    },
    computed: {
        instanceId() {
            return this.$store.state.currentInstanceId
        }
    },
    methods: {
        tableRowClassName({row, rowIndex}) {
            if (rowIndex % 2 == 0) {
                return 'warning-row'
            } else {
                return 'success-row'
            }
        },
        teleport(e) {
            console.log(e)
        },
        randomTeleport(index, row) {
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: `/spreadplayers 0 0 0 100000 false ${row.name}` })
        },
        reborn(index, row) {
            this.$store.commit('SETREBORNTYPE', 'reborn')
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: `/spawnpoint ${row.name}` })
        },
        kickPlayer(index, row) {
            this.$socket.emit('thread', { instanceId: this.instanceId, cmd: `/kick ${row.name}` })
        },
        async getPlayerList() {
            let res = await this.get('api/getOnlinePlayerList', { instanceId: this.instanceId })
            if (res.data.code === 0) {
                this.players = res.data.data.map(item => {
                    return { name: item }
                })
            }
        }
    },
    watch: {
        '$store.state.currentInstanceId'(val) {
            this.players = []
            if (val) this.getPlayerList()
        },
        '$store.state.players'(val) {
            if (val.length > 0) {
                this.players = val
            } else {
                this.players = []
            }
        }
    },
    mounted() {
        if (this.instanceId) this.getPlayerList()
    }
}
</script>
<style lang="less">
    div[quickOperation]{
        .el-table td, .el-table th{
            padding: 6px 0;
        }
        .el-table .success-row {
            background: #efedec;
        }
    }
</style>

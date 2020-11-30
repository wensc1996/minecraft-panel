<template>
    <div quickOperation>
        <el-table
            :data="players">
            <el-table-column
            prop='name'
            label="玩家">
            </el-table-column>
            <el-table-column
            label="删档">
                <template slot-scope="scope">
                    <el-button @click="deletePlayer(scope.$index, scope.row)">删档</el-button>
                </template>
            </el-table-column>
            <el-table-column
            prop="restore"
            label="回档">
            <template slot-scope="scope">
                <el-button @click="restorePLayer(scope.$index, scope.row)">回档</el-button>
            </template>
            </el-table-column>
            <el-table-column
            prop="kick"
            label="踢出服务器">
                <template slot-scope="scope">
                    <el-button @click="kickPlayer(scope.$index, scope.row)">踢出</el-button>
                </template>
            </el-table-column>
            <el-table-column
            prop="random"
            label="随机传送">
                <template slot-scope="scope">
                    <el-button @click="randomTeleport(scope.$index, scope.row)">随机传送</el-button>
                </template>
            </el-table-column>
            <el-table-column
            prop="home"
            label="回家">
                <el-button>回家</el-button>
            </el-table-column>
            <el-table-column
            prop="reborn"
            label="重生">
                <template slot-scope="scope">
                    <el-button @click="reborn(scope.$index, scope.row)">重生</el-button>
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
    methods: {
        teleport(e) {
            console.log(e)
            // this.$socket.emit('thread', '')
        },
        randomTeleport(index, row) {
            this.$socket.emit('thread', `/spreadplayers 0 0 0 100000 false ${row.name}`)
        },
        reborn(index, row) {
            this.$store.commit('SETREBORNTYPE', 'reborn') // 其中定位含有两个功能，这里用vuex来管理当前是定位还是纪录位置
            this.$socket.emit('thread', `/spawnpoint ${row.name}`)
        },
        kickPlayer(index, row) {
            this.$socket.emit('thread', `/kick ${row.name}`)
        },
        async restorePLayer(index, row) {
            let res = await this.post('wensc/restorePlayer', { playerId: row.name })
            this.$notify({
                title: '成功',
                message: res.data.msg,
                type: 'success'
            })
        },
        async getPlayerList() {
            let res = await this.get('wensc/getPlayerList', {})
            if (res.data.code == 1) {
                this.players = res.data.data
                this.$store.commit('SETPLAYERS', res.data.data)
            }
        },
        async deletePlayer(index, row) {
            let res = await this.post('wensc/deletePlayer', {
                playerId: row.name
            })
            if (res.data.code == 1) {
                this.$notify({
                    title: '成功',
                    message: res.data.msg,
                    type: 'success'
                })
            }
            this.getPlayerList()
        }
    },
    watch: {
        '$store.state.players'(val) {
            if (val.length > 0) {
                this.players = val
            } else {
                this.players = []
            }
        }
    },
    mounted() {
        this.getPlayerList()
    }
}
</script>
<style lang="scss">
    div[quickOperation]{
        .el-table td, .el-table th{
            padding: 6px 0;
        }
    }
</style>
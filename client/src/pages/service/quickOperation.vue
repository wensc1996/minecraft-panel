<template>
    <div quickOperation>
        <el-table :row-class-name="tableRowClassName"
            :data="players">
            <el-table-column
            prop='name'
            label="玩家">
            </el-table-column>
            <el-table-column
            prop="kick"
            label="踢出服务器">
                <template slot-scope="scope">
                    <el-button @click="kickPlayer(scope.$index, scope.row)" size="small">踢出</el-button>
                </template>
            </el-table-column>
            <el-table-column
            prop="random"
            label="随机传送">
                <template slot-scope="scope">
                    <el-button @click="randomTeleport(scope.$index, scope.row)" size="small">随机传送</el-button>
                </template>
            </el-table-column>
            <el-table-column
            prop="reborn"
            label="重生">
                <template slot-scope="scope">
                    <el-button @click="reborn(scope.$index, scope.row)" type="primary" size="small">重生</el-button>
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
            this.$socket.emit('thread', `/spreadplayers 0 0 0 100000 false ${row.name}`)
        },
        reborn(index, row) {
            this.$store.commit('SETREBORNTYPE', 'reborn') // 其中定位含有两个功能，这里用vuex来管理当前是定位还是纪录位置
            this.$socket.emit('thread', `/spawnpoint ${row.name}`)
        },
        kickPlayer(index, row) {
            this.$socket.emit('thread', `/kick ${row.name}`)
        },
        async getPlayerList() {
            let res = await this.get('wensc/getOnlinePlayerList', {})
            this.$store.state.players = res.data.data.map(item => {
                return {
                    name: item
                }
            })
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
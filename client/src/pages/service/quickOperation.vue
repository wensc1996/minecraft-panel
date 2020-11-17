<template>
    <div quickOperation>
        <el-table
            :data="players" @row-click="executeCommand">
            <el-table-column
            prop='name'
            label="玩家">
            </el-table-column>
            <el-table-column
            label="存档">
                <el-button>存档</el-button>
            </el-table-column>
            <el-table-column
            label="回档">
                <el-button>回档</el-button>
            </el-table-column>
            <el-table-column
            prop="kick"
            label="踢出服务器">
                <el-button>踢出</el-button>
            </el-table-column>
            <el-table-column
            prop="random"
            label="随机传送">
                <el-button>随机传送</el-button>
            </el-table-column>
            <el-table-column
            prop="home"
            label="回家">
                <el-button>回家</el-button>
            </el-table-column>
            <el-table-column
            prop="reborn"
            label="重生">
                <el-button>重生</el-button>
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
        executeCommand(row, column, event) {
            switch (column.property) {
            case 'random':
                this.randomTeleport(row.name)
                break
            case 'reborn':
                this.reborn(row.name)
                break
            }
        },
        teleport(e) {
            console.log(e)
            // this.$socket.emit('thread', '')
        },
        randomTeleport(name) {
            console.log('thread', `/spreadplayers 0 0 0 100000 false ${name}`)
            this.$socket.emit('thread', `/spreadplayers 0 0 0 100000 false ${name}`)
        },
        reborn(name) {
            this.$socket.emit('thread', `/spawnpoint ${name}`)
        }
    },
    watch: {
        '$store.state.players'(val) {
            if (val.length > 0) {
                this.players = val.map((item) => {
                    return {
                        name: item
                    }
                })
            }
        }
    },
    mounted() {
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
<template>
    <div quickOperation>
        <el-table
            :data="tableData">
            <el-table-column
            prop="name"
            label="姓名">
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
            prop="delete"
            label="删除角色">
                <el-button>删除</el-button>
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
            prop="reborn"
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
            tableData: [{
                name: '王小虎',
                province: '上海',
                city: '普陀区',
                address: '上海市普陀区金沙江路 1518 弄',
                zip: 200333
            }, {
                name: '王小虎',
                province: '上海',
                city: '普陀区',
                address: '上海市普陀区金沙江路 1518 弄',
                zip: 200333
            }, {
                name: '王小虎',
                province: '上海',
                city: '普陀区',
                address: '上海市普陀区金沙江路 1518 弄',
                zip: 200333
            }, {
                name: '王小虎',
                province: '上海',
                city: '普陀区',
                address: '上海市普陀区金沙江路 1518 弄',
                zip: 200333
            }, {
                name: '王小虎',
                province: '上海',
                city: '普陀区',
                address: '上海市普陀区金沙江路 1518 弄',
                zip: 200333
            }, {
                name: '王小虎',
                province: '上海',
                city: '普陀区',
                address: '上海市普陀区金沙江路 1518 弄',
                zip: 200333
            }, {
                name: '王小虎',
                province: '上海',
                city: '普陀区',
                address: '上海市普陀区金沙江路 1518 弄',
                zip: 200333
            }]
        }
    },
    methods: {
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
<template>
    <div roleManage>
        <el-table
        :data="roleList"
        border
        style="width: 100%">
            <el-table-column
            prop="role_id"
            label="角色ID"
            >
            </el-table-column>
            <el-table-column
            prop="role_name"
            label="角色名称"
            >
            </el-table-column>
            <el-table-column
            fixed="right"
            label="操作"
            width="150">
            <template slot-scope="scope">
                <el-button type="text" size="small" @click="assignPrivilege(scope.row)">编辑</el-button>
            </template>
            </el-table-column>
        </el-table>
        <el-dialog
        title="角色权限分配"
        :visible.sync="dialogVisible"
        width="30%"
        ref="assignPrivilege"
        >
        <AssignPrivilege :roleId="roleId" ref="privilegeAssign" @closeAssignPrivilege="closeAssignPrivilege"></AssignPrivilege>
        <span slot="footer" class="dialog-footer">
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button type="primary" @click="submitPrivilege">确 定</el-button>
        </span>
        </el-dialog>
    </div>
</template>
<script>
import AssignPrivilege from './assignPrivilege'
export default {
    components: {
        AssignPrivilege
    },
    data () {
        return {
            roleList: [],
            dialogVisible: false,
            roleId: ''
        }
    },
    methods: {
        async submitPrivilege() {
            this.$refs.privilegeAssign.submitPrivilegeAssign()
        },
        async getRoleList() {
            let res = await this.get('wensc/getRoleList')
            if (res.data.code == 1) {
                this.roleList = res.data.data
            }
        },
        assignPrivilege(item) {
            this.roleId = item.role_id
            this.dialogVisible = true
        },
        closeAssignPrivilege() {
            this.dialogVisible = false
        }
    },
    mounted() {
        this.getRoleList()
    }
}
</script>
<style lang="less">
    div[roleManage]{
    }
</style>
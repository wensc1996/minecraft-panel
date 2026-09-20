<template>
    <div roleManage>
        <div class="role-toolbar">
            <el-button type="primary" size="small" @click="openCreate" v-permission="'roleManage.btn.add'">新增角色</el-button>
        </div>
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
            width="200">
            <template slot-scope="scope">
                <el-button type="text" size="small" @click="assignPrivilege(scope.row)" v-permission="'roleManage.btn.edit'">编辑</el-button>
                <el-button type="text" size="small" style="color:#f56c6c" @click="deleteRole(scope.row)" v-permission="'roleManage.btn.delete'">删除</el-button>
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
        <el-dialog
        title="新增角色"
        :visible.sync="createVisible"
        width="30%">
            <el-form label-width="80px">
                <el-form-item label="角色名称">
                    <el-input v-model="newRoleName" placeholder="请输入角色名称" maxlength="20" show-word-limit></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="createVisible = false">取 消</el-button>
                <el-button type="primary" @click="createRole">确 定</el-button>
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
            roleId: '',
            createVisible: false,
            newRoleName: ''
        }
    },
    methods: {
        async submitPrivilege() {
            this.$refs.privilegeAssign.submitPrivilegeAssign()
        },
        async getRoleList() {
            let res = await this.get('api/getRoleList')
            if (res.data.code == 0) {
                this.roleList = res.data.data
            }
        },
        assignPrivilege(item) {
            this.roleId = item.role_id
            this.dialogVisible = true
        },
        closeAssignPrivilege() {
            this.dialogVisible = false
        },
        openCreate() {
            this.newRoleName = ''
            this.createVisible = true
        },
        async createRole() {
            const name = (this.newRoleName || '').trim()
            if (!name) {
                this.$message.warning('请输入角色名称')
                return
            }
            let res = await this.post('api/createRole', { roleName: name })
            if (res.data.code == 0) {
                this.$message.success('新增角色成功')
                this.createVisible = false
                this.newRoleName = ''
                this.getRoleList()
            } else {
                this.$message.error(res.data.msg || '新增角色失败')
            }
        },
        deleteRole(row) {
            this.$confirm(`确定删除角色「${row.role_name}」吗？该角色下的权限分配将一并清除。`, '提示', { type: 'warning' }).then(async () => {
                let res = await this.post('api/deleteRole', { roleId: row.role_id })
                if (res.data.code == 0) {
                    this.$message.success('删除成功')
                    this.getRoleList()
                } else {
                    this.$message.error(res.data.msg || '删除失败')
                }
            }).catch(() => {})
        }
    },
    mounted() {
        this.getRoleList()
    }
}
</script>
<style lang="less">
    div[roleManage]{
        .role-toolbar {
            margin-bottom: 12px;
        }
    }
</style>

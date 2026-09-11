<template>
    <div assignPrivilege>
        <el-tree
        :data="privilege"
        show-checkbox
        node-key="perm_id"
        ref="tree"
        :props="defaultProps">
        </el-tree>
    </div>
</template>
<script>
export default {
    data () {
        return {
            privilege: [],
            defaultProps: {
                children: 'children',
                label: 'perm_name',
                id: 'perm_id'
            }
        }
    },
    props: {
        roleId: ''
    },
    watch: {
        roleId: {
            handler: function(val) {
                this.getPrivilegeList()
            },
            immediate: true
        }
    },
    methods: {
        async getPrivilegeList() {
            if (this.privilege.length == 0) {
                let privilegeList = await this.get('wensc/getPrivilegeList')
                if (privilegeList.data.code == 0) {
                    this.privilege = privilegeList.data.data
                }
            }
            let rolePrivilege = await this.post('wensc/getRolePrivilege', {roleId: this.roleId})
            this.$refs.tree.setCheckedKeys(rolePrivilege.data.data.map(item => {
                return item.perm_id
            }))
        },
        async submitPrivilegeAssign() {
            let param = {
                roleId: this.roleId,
                privilgeList: this.$refs.tree.getCheckedKeys()
            }
            let res = await this.post('wensc/updatePrivilege', param)
            if (res.data.code == 0) {
                this.$notify({
                    title: '成功',
                    message: res.data.msg,
                    type: 'success'
                })
                this.$emit('closeAssignPrivilege')
            }
        }
    },
    mounted() {
    }
}
</script>
<style lang="less">
    div[assignPrivilege]{
    }
</style>
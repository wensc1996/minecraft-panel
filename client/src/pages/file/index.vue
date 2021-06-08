<template>
    <div>
        <el-tree :data="privilegeList" :props="defaultProps" @node-click="handleNodeClick" node-key="id" :default-expand-all="false"></el-tree>
    </div>
</template>
<script>
export default {
    data() {
        return {
            privilegeList: [],
            defaultProps: {
                children: 'children',
                label: 'name'
            }
        }
    },
    methods: {
        handleNodeClick(val) {
            console.log(val)
        },
        async getPrivilegeList() {
            let privilegeList = await this.post('wensc/getDirectoryOrFile')
            this.privilegeList = privilegeList.data
        }
    },
    mounted() {
        this.getPrivilegeList()
    }
}
</script>
<style lang="sass">
</style>
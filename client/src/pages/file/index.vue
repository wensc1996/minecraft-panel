<template>
    <div>
        <el-button type="primary" @click="dialogTableVisible=!dialogTableVisible" dialogTableVisible="dialogTableVisible">上传</el-button>
        <tree :data="privilegeList" :show-checkbox="true" :props="defaultProps" @node-click="handleNodeClick" node-key="id"></tree>
        <el-dialog title="文件上传" :visible.sync="dialogTableVisible">
            <fileUpload :privilegeList="privilegeList"/>
        </el-dialog>
    </div>
</template>
<script>
import fileUpload from './fileUpload'
import tree from '@/components/tree'
export default {
    components: {
        tree,
        fileUpload
    },
    data() {
        return {
            dialogTableVisible: false,
            privilegeList: [],
            defaultProps: {
                children: 'children',
                label: 'name',
                type: 'type'
            }
        }
    },
    methods: {
        executeDownload(data, name) {
            if (!data) {
                return
            }
            let url = window.URL.createObjectURL(new Blob([data]))
            let link = document.createElement('a')
            link.style.display = 'none'
            link.href = url
            link.setAttribute('download', name)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        },
        async handleNodeClick(node) {
            if (node.type == 0) {
                this.$axios({
                    method: 'get',
                    url: 'wensc/download',
                    params: { target: node.fullPath },
                    responseType: 'blob'
                }).then(res => {
                    this.executeDownload(res.data, node.name)
                })
            }
        },
        async getPrivilegeList() {
            let privilegeList = await this.post('wensc/getDirectoryOrFile', { filed: 1 })
            this.privilegeList = privilegeList.data
        }
    },
    mounted() {
        this.getPrivilegeList()
    }
}
</script>
<style lang="sass">
    .el-dialog__body{
        padding: 10px 30px;
    }
</style>
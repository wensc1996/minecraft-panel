<template>
    <div>
        <el-button type="primary" @click="dialogTableVisible=!dialogTableVisible" dialogTableVisible="dialogTableVisible">创建目录/上传</el-button>
        <el-button type="primary" @click="deleteFileOrDirectory">删除</el-button>
        <tree
            :data="fileTree"
            :show-checkbox="true"
            :props="defaultProps"
            @node-click="handleNodeClick"
            node-key="id"
            ref="tree"
            @node-contextmenu="rename"
            :check-strictly="true"
            :default-expanded-keys="[fileTree[0].id]"
        ></tree>
        <el-dialog title="文件上传" :visible.sync="dialogTableVisible">
            <fileUpload :fileTree="fileTree" @getFileTree="getFileTree"/>
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
            fileTree: [],
            defaultProps: {
                children: 'children',
                label: 'name',
                type: 'type'
            }
        }
    },
    methods: {
        rename(event, oldNode, node, currentNode) {
            if (oldNode.name == 'mc') {
                this.$message({
                    type: 'error',
                    message: '禁止重命名根目录'
                })
                return
            }
            this.$prompt('【重命名】如果修改文件类型，有可能造成文件无法正常运行', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputPattern: /\S+/,
                inputValue: oldNode.name,
                inputErrorMessage: '命名不能为空'
            }).then(async ({ value }) => {
                let oldPath = oldNode.fullPath
                let newPath = oldNode.fullPath.replace(new RegExp(`${oldNode.name}`), value)
                let res = await this.post('wensc/renameDirectoryOrFile', {
                    oldPath,
                    newPath
                })
                if (res.data.code == 1) {
                    this.$notify({
                        title: '成功',
                        message: '重命名成功',
                        type: 'success'
                    })
                    this.getFileTree()
                } else {
                    this.$notify({
                        title: '失败',
                        message: '重命名失败',
                        type: 'error'
                    })
                }
            }).catch(() => {
            })
        },
        deleteFileOrDirectory() {
            let treeNodes = this.$refs.tree.getCheckedNodes()
            if (treeNodes.find(item => item.name == 'mc')) {
                this.$message({
                    type: 'error',
                    message: '禁止删除根目录'
                })
                return
            }
            this.$confirm('此操作将永久删除所选文件或目录, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                let res = await this.post('wensc/deleteFileOrDirectory', treeNodes)
                if (res.data.code == 1) {
                    this.$notify({
                        title: '成功',
                        message: '删除成功',
                        type: 'success'
                    })
                } else {
                    this.$notify({
                        title: '失败',
                        message: '部分删除或者未删除',
                        type: 'error'
                    })
                }
                this.getFileTree()
            })
        },
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
        async getFileTree() {
            let res = await this.post('wensc/getDirectoryOrFile', { filed: 1 })
            if(res.data.code == 1) {
                this.fileTree = res.data.data
            } else {
                this.$notify({
                    title: '失败',
                    message: res.data.msg,
                    type: 'error'
                })
            }
        }
    },
    mounted() {
        this.getFileTree()
    }
}
</script>
<style lang="less">
    .el-dialog__body{
        padding: 10px 30px;
    }
</style>
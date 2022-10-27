<template>
    <div>
        <p class="tips">请点击目标文件夹，然后点击上传</p>
        <tree :data="directory"
        :default-expand-all="true"
        :highlight-current="true"
        :expand-on-click-node="false"
        :props="defaultProps"
        @node-click="activeDirec"
        node-key="id"
        icon-class=""
        ></tree>
        <el-row type="flex" justify="space-between">
            <el-col :span="8" >
                <el-popover
                placement="top-start"
                width="160"
                v-model="visibleDirectoryName">
                    <el-input v-model="directoryName" placeholder="请输入目录名称"></el-input>
                    <div style="text-align: right; margin: 0">
                        <el-button size="mini" type="text" @click="visibleDirectoryName = false">取消</el-button>
                        <el-button type="primary" size="mini" @click="createDirectory">确定</el-button>
                    </div>
                    <el-button slot="reference" size="small" type="primary">创建目录</el-button>
                </el-popover>
            </el-col>
            <el-col :span="8">
                <el-upload
                    :http-request="uploadFile"
                    class="upload-demo"
                    action="wensc/uploadFile"
                    :limit="1"
                    :file-list="fileList">
                    <el-button size="small" type="primary">选择文件并上传</el-button>
                </el-upload>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import tree from '@/components/tree'
export default {
    components: {
        tree
    },
    data() {
        return {
            visibleDirectoryName: false,
            directoryName: '',
            uploadForm: new FormData(),
            fileList: [],
            target: '',
            directory: [],
            defaultProps: {
                children: 'children',
                label: 'name',
                type: 'type'
            }
        }
    },
    watch: {
        dialogTableVisible(val) {
            if (val) {
            }
        }
    },
    mounted() {
        this.getDirectory()
    },
    methods: {
        async createDirectory() {
            this.visibleDirectoryName = false
            if (!this.target) {
                this.$message.error('请先选择目标目录')
                return
            }
            if (!this.directoryName) {
                this.$message.error('请输入目录名称')
                return
            }
            let res = await this.post('wensc/createNewDirectory', { fullPath: `${this.target}/${this.directoryName}` })
            if (res.data.code == 1) {
                this.$notify({
                    title: '成功',
                    message: '创建目录成功',
                    type: 'success'
                })
                this.getDirectory()
                this.$emit('getFileTree')
            } else {
                this.$notify({
                    title: '失败',
                    message: '创建目录失败',
                    type: 'error'
                })
            }
        },
        activeDirec(node) {
            this.target = node.fullPath
        },
        async getDirectory() {
            let res = await this.post('wensc/getDirectoryOrFile', { filed: 0 })
            if(res.data.code == 1) {
                this.directory = res.data.data
            } else {
                this.$notify({
                    title: '失败',
                    message: res.data.msg,
                    type: 'error'
                })
            }
        },
        async uploadFile(file) {
            if (!this.target) {
                this.$message.error('请先选择上传目录')
                this.fileList = []
                return
            }
            this.uploadForm.append('target', this.target)
            this.uploadForm.append('files', file.file) // 上传的文件放在files里面了
            let res = await this.$axios({
                method: 'post',
                url: 'wensc/uploadFileToTargetDirec',
                data: this.uploadForm
            })
            if (res.data.code == 1) {
                this.$notify({
                    title: '成功',
                    message: '上传文件成功',
                    type: 'success'
                })
                this.$emit('getFileTree')
            } else {
                this.$notify({
                    title: '失败',
                    message: '上传文件失败',
                    type: 'error'
                })
            }
            this.fileList = []
        }
    }
}
</script>
<style lang="less">
.tips{
    color: orange;
    padding-bottom: 5px;
}
.el-tree--highlight-current .el-tree-node.is-current>.el-tree-node__content{
    background-color: #8aecff;
}
</style>
<template>
    <div>
        <p class="tips">请点击目标文件夹，然后点击上传</p>
        <tree :data="directory"
        default-expand-all="true"
        highlight-current="true"
        :expand-on-click-node="false"
        :props="defaultProps"
        @node-click="activeDirec"
        node-key="id"
        icon-class=""
        ></tree>
        <el-upload
            :http-request="uploadFile"
            class="upload-demo"
            action="wensc/uploadFile"
            :limit="1"
            :file-list="fileList">
            <el-button size="small" type="primary">选择文件并上传</el-button>
        </el-upload>
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
        activeDirec(node) {
            this.target = node.fullPath
        },
        async getDirectory() {
            let directory = await this.post('wensc/getDirectoryOrFile', { filed: 0 })
            this.directory = directory.data
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
<style lang="sass">
.tips{
    color: orange;
    padding-bottom: 5px;
}
.el-tree--highlight-current .el-tree-node.is-current>.el-tree-node__content{
    background-color: #8aecff;
}
</style>
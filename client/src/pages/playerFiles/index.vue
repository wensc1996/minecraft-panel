<template>
    <div>
        <el-upload
            :http-request="uploadFile"
            class="upload-demo"
            action="wensc/uploadFile"
            :limit="1"
            :file-list="fileList">
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">只能上传.dat文件</div>
        </el-upload>
        <el-table
        :data="tableData"
        style="width: 100%">
            <el-table-column
                prop="name"
                label="玩家存档"
                >
            </el-table-column>
            <el-table-column
                label="操作"
                width="180">
                <template slot-scope="scope">
                    <el-button @click="savePlayerFile(scope.$index, scope.row)" type="text" size="small">存档备份</el-button>
                    <el-button @click="restorePlayerFile(scope.$index, scope.row)" type="text" size="small">回档还原</el-button>
                    <el-button type="text" size="small" @click="deletePlayerFile(scope.$index, scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script>
export default {
    components: {
    },
    data() {
        return {
            tableData: [],
            fileList: [],
            uploadForm: new FormData()
        }
    },
    created() {
        this.getPlayerFileList()
    },
    methods: {
        async uploadFile(file) {
            let name = file.file.name
            if (name.substr(name.lastIndexOf('.') + 1) != 'dat') {
                this.$notify.error({
                    title: '错误',
                    message: '请上传.dat文件'
                })
                this.fileList = []
                return
            }
            this.uploadForm.append('files', file.file) // 上传的文件放在files里面了
            let res = await this.$axios({
                method: 'post',
                url: 'wensc/uploadFile',
                data: this.uploadForm
            })
            if (res.data.code == 1) {
                this.$notify({
                    title: '成功',
                    message: '上传玩家存档成功',
                    type: 'success'
                })
                this.getPlayerFileList()
            } else {
                this.$notify.error({
                    title: '错误',
                    message: res.data.msg
                })
            }
            this.fileList = []
        },
        async savePlayerFile(index, row) {
            let res = await this.post('wensc/backupPlayer', {playerId: row.name})
            if (res.data.code == 1) {
                this.$notify({
                    title: '成功',
                    message: res.data.msg,
                    type: 'success'
                })
            } else {
                this.$notify.error({
                    title: '错误',
                    message: res.data.msg
                })
            }
        },
        async restorePlayerFile(index, row) {
            let res = await this.post('wensc/restorePlayer', { playerId: row.name })
            if (res.data.code == 1) {
                this.$notify({
                    title: '成功',
                    message: res.data.msg,
                    type: 'success'
                })
            } else {
                this.$notify({
                    title: '失败',
                    message: res.data.msg,
                    type: 'error'
                })
            }
        },
        async deletePlayerFile(index, row) {
            this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.post('wensc/deletePlayer', {
                    playerId: row.name
                }).then((res) => {
                    if (res.data.code == 1) {
                        this.$notify({
                            title: '成功',
                            message: res.data.msg,
                            type: 'success'
                        })
                    } else {
                        this.$notify({
                            title: '失败',
                            message: res.data.msg,
                            type: 'error'
                        })
                    }
                    this.getPlayerFileList()
                })
            }).catch(res => {
            })
        },
        async getPlayerFileList() {
            let res = await this.get('wensc/getPlayerFileList', {})
            if (res.data.code == 1) {
                this.tableData = res.data.data.map(item => {
                    return { name: item }
                })
            } else {
                this.$notify({
                    title: '失败',
                    message: res.data.msg,
                    type: 'error'
                })
            }
        }
    }
}
</script>
<template>
    <div class="upload-panel">
        <el-alert
            class="upload-tip"
            type="info"
            :closable="false"
            show-icon
            title="先选择左侧目标目录，再将文件拖入下方区域（或点击选择）即可上传" />

        <div class="upload-target" :class="{ 'is-empty': !target }">
            <i :class="target ? 'el-icon-folder-opened' : 'el-icon-info'"></i>
            <span class="upload-target__label">上传到</span>
            <code v-if="target" class="upload-target__path">{{ target }}</code>
            <span v-else class="upload-target__hint">尚未选择目标目录</span>
        </div>

        <div class="upload-body">
            <div class="upload-tree">
                <tree
                    :data="directory"
                    :default-expand-all="true"
                    :highlight-current="true"
                    :expand-on-click-node="false"
                    :props="defaultProps"
                    :render-content="renderDirectoryContent"
                    @node-click="activeDirec"
                    node-key="id"
                    icon-class="">
                </tree>
            </div>

            <div class="upload-actions">
                <el-popover
                    placement="bottom"
                    width="220"
                    v-model="visibleDirectoryName">
                    <div class="dir-create">
                        <el-input v-model="directoryName" size="small" placeholder="请输入目录名称" @keyup.enter.native="createDirectory"></el-input>
                        <div class="dir-create__btns">
                            <el-button size="mini" type="text" @click="visibleDirectoryName = false">取消</el-button>
                            <el-button type="primary" size="mini" @click="createDirectory">确定</el-button>
                        </div>
                    </div>
                    <el-button slot="reference" size="small" icon="el-icon-folder-add" type="primary" plain>新建目录</el-button>
                </el-popover>

                <el-upload
                    class="upload-drag"
                    drag
                    :http-request="uploadFile"
                    action="api/uploadFile"
                    :limit="1"
                    :file-list="fileList">
                    <i class="el-icon-upload"></i>
                    <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
                    <div class="el-upload__hint">单个文件 · 上传至所选目录</div>
                </el-upload>
            </div>
        </div>
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
            },
            renderDirectoryContent: (h, { data }) => {
                const isFile = data.type === 0
                const icon = isFile ? 'el-icon-document' : 'el-icon-folder'
                return h('span', { class: 'dir-node' }, [
                    h('i', { class: icon + ' dir-node__icon' }),
                    h('span', { class: 'dir-node__label' }, data.name)
                ])
            }
        }
    },
    props: {
        dialogTableVisible: {
            type: Boolean,
            default: false
        },
        scope: {
            type: String,
            default: 'instance'
        }
    },
    computed: {
        instanceId() {
            return this.scope === 'tenant' ? null : this.$store.state.currentInstanceId
        },
        ready() {
            return this.scope === 'tenant' || this.instanceId
        }
    },
    watch: {
        dialogTableVisible(val) {
            if (val) {
                this.getDirectory()
            }
        }
    },
    mounted() {
        this.getDirectory()
    },
    methods: {
        scopeOpts() {
            return this.scope === 'tenant' ? {} : { instanceId: this.instanceId }
        },
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
            let res = await this.post('api/createNewDirectory', { ...this.scopeOpts(), fullPath: `${this.target}/${this.directoryName}` })
            if (res.data.code == 0) {
                this.$notify({ title: '成功', message: '创建目录成功', type: 'success' })
                this.getDirectory()
                this.$emit('getFileTree')
            } else {
                this.$notify({ title: '失败', message: '创建目录失败', type: 'error' })
            }
        },
        activeDirec(node) {
            this.target = node.fullPath
        },
        async getDirectory() {
            if (!this.ready) {
                this.directory = []
                return
            }
            let res = await this.post('api/getDirectoryOrFile', { filed: 0, ...this.scopeOpts() })
            if (res.data.code == 0) {
                this.directory = res.data.data
            } else {
                this.$notify({ title: '失败', message: res.data.msg, type: 'error' })
            }
        },
        async uploadFile(file) {
            if (!this.target) {
                this.$message.error('请先选择上传目录')
                this.fileList = []
                return
            }
            if (!this.ready) {
                this.$message.error('请先选择目标目录')
                this.fileList = []
                return
            }
            this.uploadForm = new FormData()
            this.uploadForm.append('target', this.target)
            if (this.instanceId) this.uploadForm.append('instanceId', this.instanceId)
            this.uploadForm.append('files', file.file)
            let res = await this.$axios({
                method: 'post',
                url: 'api/uploadFileToTargetDirec',
                data: this.uploadForm
            })
            if (res.data.code == 0) {
                this.$notify({ title: '成功', message: '上传文件成功', type: 'success' })
                this.$emit('getFileTree')
            } else {
                this.$notify({ title: '失败', message: '上传文件失败', type: 'error' })
            }
            this.fileList = []
        }
    }
}
</script>
<style lang="less" scoped>
.upload-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.upload-tip {
    margin: 0;
    border-radius: 8px;
}
.upload-target {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background: #f7f9fc;
    color: #303133;
    font-size: 13px;
    transition: border-color .2s ease, background .2s ease;
    &.is-empty {
        color: #909399;
        background: #fafafa;
    }
    i {
        color: #409EFF;
        font-size: 16px;
    }
    &__label {
        color: #909399;
        flex: 0 0 auto;
    }
    &__path {
        font-family: Consolas, Monaco, monospace;
        color: #303133;
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        padding: 2px 8px;
        word-break: break-all;
    }
    &__hint {
        color: #909399;
    }
}
.upload-body {
    display: flex;
    gap: 16px;
    align-items: stretch;
}
.upload-tree {
    flex: 1 1 auto;
    min-width: 0;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 8px;
    max-height: 300px;
    overflow: auto;
    background: #fff;
}
.upload-actions {
    flex: 0 0 240px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.dir-create {
    &__btns {
        margin-top: 8px;
        text-align: right;
    }
}
.upload-drag {
    flex: 1 1 auto;
    :deep(.el-upload),
    :deep(.el-upload-dragger) {
        width: 100%;
    }
    :deep(.el-upload-dragger) {
        height: auto;
        padding: 24px 12px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-radius: 8px;
    }
    :deep(.el-icon-upload) {
        margin: 0 0 8px;
        font-size: 44px;
        color: #c0c4cc;
    }
    :deep(.el-upload__text) {
        line-height: 1.4;
    }
    :deep(.el-upload__hint) {
        margin-top: 4px;
        color: #c0c4cc;
        font-size: 12px;
    }
}
/* 目录树节点（图标 + 文字） */
.dir-node {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    &__icon {
        color: #909399;
        font-size: 14px;
    }
    &__label {
        color: #303133;
    }
}
.upload-tree {
    :deep(.el-tree-node__content) {
        height: 30px;
        border-radius: 6px;
        transition: background .15s ease;
    }
    :deep(.el-tree-node.is-current > .el-tree-node__content) {
        background: #ecf5ff;
        .dir-node__icon {
            color: #409EFF;
        }
    }
}
@media (max-width: 640px) {
    .upload-body {
        flex-direction: column;
    }
    .upload-actions {
        flex: 1 1 auto;
    }
}
</style>

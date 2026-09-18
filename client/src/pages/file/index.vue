<template>
    <div>
        <template v-if="ready">
            <div class="file-body">
                <div class="file-toolbar">
                    <el-button type="primary" @click="dialogTableVisible=!dialogTableVisible" dialogTableVisible="dialogTableVisible" size="small" v-permission="permPrefix + '.create'">创建目录/上传</el-button>
                    <el-button type="danger" @click="deleteFileOrDirectory" size="small" v-permission="permPrefix + '.delete'">删除</el-button>
                    <el-button type="success" @click="packageDownload" size="small" v-permission="permPrefix + '.batchDownload'">打包下载</el-button>
                </div>
                <div class="file-tree">
                    <tree
                        :data="fileTree"
                        :show-checkbox="true"
                        :props="defaultProps"
                        node-key="id"
                        ref="tree"
                        :check-strictly="true"
                        :default-expanded-keys="expandKeys"
                        :render-content="renderNodeContent"
                    ></tree>
                </div>
            </div>
            <el-dialog title="文件上传" :visible.sync="dialogTableVisible">
                <fileUpload :scope="scope" :fileTree="fileTree" @getFileTree="getFileTree" :dialogTableVisible="dialogTableVisible"/>
            </el-dialog>
            <el-dialog title="处理进度" :visible.sync="progress.visible" width="420px" :close-on-click-modal="false" :show-close="false">
                <el-progress
                    :percentage="progress.percent"
                    :indeterminate="progress.total === 0"
                    :status="progress.percent >= 100 ? 'success' : ''"
                ></el-progress>
                <div class="progress-tip">
                    <span v-if="progress.type === 'download'">{{ progress.label || '正在打包并下载…' }}</span>
                    <span v-else-if="progress.type === 'extract'">已解压 {{ progress.done }} / {{ progress.total }} 项</span>
                    <span v-else>已处理 {{ progress.done }} / {{ progress.total }} 项</span>
                </div>
            </el-dialog>
        </template>
        <el-empty v-else :description="emptyText"></el-empty>
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
    props: {
        // 'instance'：按当前选中实例 work_path；'tenant'：按租户 storage_path（顶级文件管理）
        scope: {
            type: String,
            default: 'instance'
        }
    },
    data() {
        return {
            dialogTableVisible: false,
            fileTree: [],
            defaultProps: {
                children: 'children',
                label: 'name',
                type: 'type'
            },
            expandKeys: [],
            socketId: '',
            progress: {
                visible: false,
                type: 'delete',
                done: 0,
                total: 0,
                percent: 0,
                label: ''
            },
            renderNodeContent: (h, { data }) => {
                const self = this;
                const isFile = data.type === 0;
                const isZip = isFile && /\.zip$/i.test(data.name);
                const disabled = !!data.disabled;
                const canDownload = self.checkEnabled(self.permPrefix + '.download');
                const canDelete = self.checkEnabled(self.permPrefix + '.delete');
                const canRename = self.checkEnabled(self.permPrefix + '.rename');
                const canExtract = self.checkEnabled(self.permPrefix + '.create'); // 解压会写入文件，复用“创建/上传”权限
                const ops = [];
                if (canDownload) {
                    ops.push(h('span', {
                        class: 'node-op',
                        attrs: { title: isFile ? '下载' : '打包下载' },
                        on: { click: (e) => { e.stopPropagation(); if (isFile) self.downloadSingle(data); else self.packageDownload([data]); } }
                    }, [h('i', { class: isFile ? 'el-icon-download' : 'el-icon-folder-checked' })]));
                }
                if (isZip && canExtract) {
                    ops.push(h('span', {
                        class: 'node-op',
                        attrs: { title: '解压' },
                        on: { click: (e) => { e.stopPropagation(); self.extractZip(data); } }
                    }, [h('i', { class: 'el-icon-files' })]));
                }
                if (canRename && !disabled) {
                    ops.push(h('span', {
                        class: 'node-op',
                        attrs: { title: '重命名' },
                        on: { click: (e) => { e.stopPropagation(); self.renameNode(data); } }
                    }, [h('i', { class: 'el-icon-edit' })]));
                }
                if (canDelete && !disabled) {
                    ops.push(h('span', {
                        class: 'node-op node-op-danger',
                        attrs: { title: '删除' },
                        on: { click: (e) => { e.stopPropagation(); self.deleteSingle(data); } }
                    }, [h('i', { class: 'el-icon-delete' })]));
                }
                const iconCls = isFile ? 'el-icon-document' : 'el-icon-folder';
                return h('span', { class: 'tree-node-row' }, [
                    h('span', { class: iconCls + ' el-tree-node__label' }, [h('span', { class: 'tree-label' }, data.name)]),
                    h('span', { class: 'node-ops' }, ops)
                ]);
            }
        }
    },
    computed: {
        instanceId() {
            return this.scope === 'tenant' ? null : this.$store.state.currentInstanceId
        },
        ready() {
            return this.scope === 'tenant' || this.instanceId
        },
        emptyText() {
            return this.scope === 'tenant' ? '未配置租户存储目录' : '请先在“控制面板”选择一个服务器实例，再管理其文件'
        },
        // 按钮权限前缀：实例内文件管理页签(cmd.tab.fileManage=104) 与 租户文件管理页(fileManage=11) 复用本组件，按 scope 区分
        permPrefix() {
            return this.scope === 'tenant' ? 'fileManage.btn' : 'cmd.fileManage.btn'
        }
    },
    sockets: {
        connect() {
            this.socketId = this.$socket.id
        },
        wensc(res) {
            if (!res || !res.type) return
            const typeMap = { deleteProgress: 'delete', downloadProgress: 'download', extractProgress: 'extract' }
            const t = typeMap[res.type]
            if (t) {
                const data = res.data || {}
                this.progress.visible = true
                this.progress.type = t
                this.progress.done = data.done || 0
                this.progress.total = data.total || 0
                this.progress.percent = data.total ? Math.floor((data.done / data.total) * 100) : 0
                if (res.type === 'downloadProgress') {
                    this.progress.label = this.formatBytes(data.done) + ' / ' + this.formatBytes(data.total)
                }
                if (data.msg === 'done') {
                    this.progress.percent = 100
                    // 解压完成信号（extractProgress.done）可能晚于 HTTP 响应到达，
                    // 这里主动关闭弹窗，避免被后续事件重新置为可见而关不掉
                    if (res.type === 'extractProgress') this.progress.visible = false
                }
            }
        }
    },
    methods: {
        // 打开进度弹窗（type: delete/download）
        openProgress(type) {
            this.progress = { visible: true, type, done: 0, total: 0, percent: 0, label: '' }
        },
        // 字节数格式化（B/KB/MB/GB/TB）
        formatBytes(bytes) {
            if (!bytes || bytes < 0) return '0 B'
            const k = 1024
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
            const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
            return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
        },
        // 租户级不传 instanceId，后端自动以 storage_path 作为根目录
        scopeOpts() {
            return this.scope === 'tenant' ? {} : { instanceId: this.instanceId }
        },
        renameNode(node) {
            if (!this.checkEnabled(this.permPrefix + '.rename')) {
                this.$notify({ title: '警告', message: '无重命名权限', type: 'warning' })
                return
            }
            if (node.disabled) {
                this.$notify({ title: '警告', message: '禁止重命名根目录', type: 'warning' })
                return
            }
            this.$prompt('【重命名】如果修改文件类型，有可能造成文件无法正常运行', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputPattern: /\S+/,
                inputValue: node.name,
                inputErrorMessage: '命名不能为空'
            }).then(async ({ value }) => {
                let oldPath = node.fullPath
                let newPath = node.fullPath.replace(new RegExp(`${node.name}`), value)
                let res = await this.post('wensc/renameDirectoryOrFile', {
                    ...this.scopeOpts(),
                    oldPath,
                    newPath
                })
                if (res.data.code == 0) {
                    this.$notify({ title: '成功', message: '重命名成功', type: 'success' })
                    this.getFileTree()
                } else {
                    this.$notify({ title: '失败', message: '重命名失败', type: 'error' })
                }
            }).catch(() => {})
        },
        deleteNodes(nodes) {
            if (!nodes || !nodes.length) {
                this.$notify({ title: '失败', message: '请先选择文件或者文件夹', type: 'error' })
                return
            }
            this.$confirm('此操作将永久删除所选文件或目录, 是否继续?', '提示', { type: 'warning' }).then(async () => {
                this.openProgress('delete')
                let res = await this.post('wensc/deleteFileOrDirectory', { ...this.scopeOpts(), list: nodes, socketId: this.socketId || (this.$socket && this.$socket.id) || '' })
                this.progress.visible = false
                if (res.data.code == 0) {
                    this.$notify({ title: '成功', message: '删除成功', type: 'success' })
                } else {
                    this.$notify({ title: '失败', message: '部分删除或者未删除', type: 'error' })
                }
                this.getFileTree()
            }).catch(() => {})
        },
        deleteFileOrDirectory() {
            const treeNodes = this.$refs.tree.getCheckedNodes()
            if (treeNodes.length == 0) {
                this.$notify({ title: '失败', message: '请先选择文件或者文件夹', type: 'error' })
                return
            }
            this.deleteNodes(treeNodes)
        },
        deleteSingle(node) {
            this.deleteNodes([node])
        },
        async extractZip(node) {
            if (!this.checkEnabled(this.permPrefix + '.create')) {
                this.$notify({ title: '警告', message: '无解压权限（需要“创建/上传”权限）', type: 'warning' })
                return
            }
            if (!/\.zip$/i.test(node.name)) {
                this.$message.warning('仅支持 .zip 压缩包解压')
                return
            }
            this.openProgress('extract')
            try {
                let res = await this.post('wensc/extractZip', {
                    target: node.fullPath,
                    ...this.scopeOpts(),
                    socketId: this.socketId || (this.$socket && this.$socket.id) || ''
                })
                this.progress.visible = false
                if (res.data.code == 0) {
                    this.$notify({ title: '成功', message: '解压成功', type: 'success' })
                    this.getFileTree()
                } else {
                    this.$notify({ title: '失败', message: res.data.msg, type: 'error' })
                }
            } catch (e) {
                this.progress.visible = false
                this.$message.error('解压请求失败：' + (e && e.message ? e.message : e))
            }
        },
        async packageDownload(nodes) {
            if (!nodes) nodes = this.$refs.tree.getCheckedNodes();
            if (!nodes.length) {
                this.$message.warning('请先勾选要下载的文件或目录');
                return;
            }
            const list = nodes.map(n => ({ fullPath: n.fullPath, type: n.type }));
            this.openProgress('download')
            try {
                const res = await this.$axios({
                    method: 'post',
                    url: 'wensc/packageDownload',
                    data: { list, ...this.scopeOpts(), socketId: this.socketId || (this.$socket && this.$socket.id) || '' },
                    responseType: 'blob'
                });
                const ct = (res.headers && res.headers['content-type']) || '';
                if (ct.indexOf('application/json') !== -1) {
                    const text = await res.data.text();
                    let msg = '打包下载失败';
                    try { msg = (JSON.parse(text) || {}).msg || msg; } catch (e) {}
                    this.$message.error(msg);
                    this.progress.visible = false
                    return;
                }
                const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mcpanel-download.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                // 延迟回收对象 URL：部分浏览器在下载未完成时若立即 revoke 会导致下载为空/失败
                setTimeout(() => window.URL.revokeObjectURL(url), 60000);
                this.$message.success('已开始下载打包文件');
                this.progress.visible = false
            } catch (e) {
                this.progress.visible = false
                this.$message.error('打包下载请求失败：' + (e && e.message ? e.message : e));
            }
        },
        executeDownload(data, name) {
            if (!data) return
            let url = window.URL.createObjectURL(new Blob([data]))
            let link = document.createElement('a')
            link.style.display = 'none'
            link.href = url
            link.setAttribute('download', name)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        },
        downloadSingle(node) {
            if (!this.checkEnabled(this.permPrefix + '.download')) {
                this.$notify({ title: '警告', message: '无下载权限', type: 'warning' })
                return
            }
            this.openProgress('download')
            this.$axios({
                method: 'get',
                url: 'wensc/download',
                params: { target: node.fullPath, ...this.scopeOpts() },
                responseType: 'blob',
                onDownloadProgress: (e) => {
                    const total = e.total || 0
                    this.progress.done = e.loaded || 0
                    this.progress.total = total
                    this.progress.percent = total ? Math.floor((e.loaded / total) * 100) : 0
                    this.progress.label = this.formatBytes(e.loaded) + (total ? ' / ' + this.formatBytes(total) : '')
                }
            }).then(res => {
                this.progress.visible = false
                this.executeDownload(res.data, node.name)
            }).catch(() => { this.progress.visible = false })
        },
        async getFileTree() {
            let res = await this.post('wensc/getDirectoryOrFile', { filed: 1, ...this.scopeOpts() })
            if (res.data.code == 0) {
                this.fileTree = res.data.data
                if (this.fileTree.length > 0) {
                    this.fileTree[0].disabled = true
                    this.expandKeys = [this.fileTree[0].id]
                }
            } else {
                this.$notify({ title: '失败', message: res.data.msg, type: 'error' })
            }
        }
    },
    watch: {
        instanceId(val) {
            this.fileTree = []
            if (val) this.getFileTree()
        }
    },
    mounted() {
        if (this.ready) this.getFileTree()
    }
}
</script>
<style lang="less">
    .el-dialog__body{
        padding: 10px 30px;
    }
    .progress-tip{
        margin-top: 12px;
        color: #909399;
        font-size: 13px;
        text-align: center;
    }
    .file-body{
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .file-toolbar{
        flex: 0 0 auto;
        margin-bottom: 10px;
    }
    .file-tree{
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        padding: 6px 4px;
        background: #fff;
    }
    .file-tree .el-tree-node__content {
        position: relative;
        height: 28px;
        line-height: 28px;
        padding-right: 70px; /* 为右侧悬浮操作层留出空间，避免文字与图标重叠 */
    }
    .file-tree .el-tree-node {
        margin: 2px 0; /* 节点之间增加间距，不再拥挤 */
    }
    .tree-node-row {
        display: inline-flex;
        align-items: center;
    }
    .node-ops {
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        visibility: hidden;
        background: #fff;
        padding-left: 6px;
    }
    .file-tree .el-tree-node__content:hover .node-ops {
        visibility: visible;
    }
    .node-op {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        margin-left: 2px;
        border-radius: 4px;
        cursor: pointer;
        color: #606266;
        font-size: 14px;
    }
    .node-op:hover {
        background: #f0f2f5;
        color: #409EFF;
    }
    .node-op-danger:hover {
        background: #fef0f0;
        color: #F56C6C;
    }
</style>

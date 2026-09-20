<template>
    <el-dialog
        :title="title"
        :visible.sync="syncedVisible"
        width="80%"
        top="5vh"
        :close-on-click-modal="false"
        @opened="onOpened"
        @close="onClose"
    >
        <div class="editor-meta row ai-c jc-sb">
            <span class="editor-path" :title="node && node.fullPath">{{ node && node.fullPath }}</span>
            <div class="row ai-c">
                <div class="col ai-c" style="margin-right: 8px">
                    <div class="encoding-label">编码格式</div>
                    <!-- 乱码时可切换 GBK/GB2312 或 UTF-8 重新解码 -->
                    <div class="encoding-hint">乱码时可切换 GBK/GB2312 或 UTF-8</div>
                </div>
                <el-select
                    v-model="encoding"
                    size="small"
                    :disabled="loading"
                    class="encoding-select"
                    @change="onEncodingChange"
                >
                    <el-option v-for="e in encodings" :key="e.value" :label="e.label" :value="e.value" />
                </el-select>
            </div>
        </div>
        <div v-loading="loading" element-loading-text="读取中…" class="editor-wrap">
            <div ref="editor" class="monaco-editor"></div>
        </div>
        <span slot="footer" class="dialog-footer">
            <el-button size="small" @click="syncedVisible = false">取消</el-button>
            <el-button size="small" type="primary" :disabled="!dirty || saving" :loading="saving" @click="save">保存</el-button>
        </span>
    </el-dialog>
</template>
<script>
import * as monaco from 'monaco-editor'

// Monaco Web Worker 引导：把 node_modules/monaco-editor/min/vs 静态资源拷贝到 /static/monaco/vs
// （在 webpack 配置中通过 copy-webpack-plugin 完成），生产环境由此加载 worker；
// 开发环境若未提供静态目录，Monaco 会自动降级到主线程运行，编辑不受影响。
if (!self.MonacoEnvironment || !self.MonacoEnvironment.getWorkerUrl) {
    const base = '/static/monaco/vs'
    self.MonacoEnvironment = {
        getWorkerUrl() {
            const blob = new Blob([
                `self.MonacoEnvironment = { baseUrl: '${base}/' };\nimportScripts('${base}/base/worker/workerMain.js');`
            ], { type: 'text/javascript' })
            return URL.createObjectURL(blob)
        }
    }
}

// 根据文件名后缀推断 Monaco 语言（覆盖 MC 常见配置文件类型）
function langFromName(name) {
    const ext = (/\.([a-z0-9]+)$/i.exec(name || '') || [])[1]
    if (!ext) return 'plaintext'
    const map = {
        json: 'json', yml: 'yaml', yaml: 'yaml', toml: 'ini', ini: 'ini',
        txt: 'plaintext', log: 'plaintext', cfg: 'ini', conf: 'ini',
        properties: 'ini', prop: 'ini', xml: 'xml', html: 'html', htm: 'html',
        js: 'javascript', ts: 'typescript', jsx: 'javascript', java: 'java',
        py: 'python', sh: 'shell', bash: 'shell', bat: 'bat', cmd: 'bat',
        psm1: 'powershell', md: 'markdown', css: 'css', scss: 'scss',
        less: 'less', sql: 'sql',     lua: 'lua', yml: 'yaml'
    }
    return map[ext.toLowerCase()] || 'plaintext'
}

// 可选编码（后端使用 iconv-lite 解码/编码，覆盖 MC 常见中文/西文编码）
const ENCODINGS = [
    { label: 'UTF-8', value: 'utf-8' },
    { label: 'GBK', value: 'gbk' },
    { label: 'GB2312', value: 'gb2312' },
    { label: 'GB18030', value: 'gb18030' },
    { label: 'UTF-16 LE', value: 'utf-16le' },
    { label: 'Latin1 (ISO-8859-1)', value: 'latin1' },
    { label: 'ASCII', value: 'ascii' }
]

export default {
    props: {
        visible: { type: Boolean, default: false },
        node: { type: Object, default: null },
        scope: { type: String, default: 'instance' }
    },
    data() {
        return {
            loading: false,
            saving: false,
            dirty: false,
            editor: null,
            loadedContent: '',
            encoding: 'utf-8',
            loadedEncoding: 'utf-8',
            encodings: ENCODINGS
        }
    },
    computed: {
        title() {
            return '编辑文件 - ' + (this.node ? this.node.name : '')
        },
        // 与父组件的 editorVisible 双向同步：关闭弹窗时把 update:visible 抛给父组件，
        // 否则父状态会卡在 true，父组件下次重渲染时弹窗会再次弹出（切 tab 后回到文件管理即此问题）
        syncedVisible: {
            get() {
                return this.visible
            },
            set(v) {
                this.$emit('update:visible', v)
            }
        }
    },
    watch: {
        visible(v) {
            if (v && this.node) this.load()
        }
    },
    methods: {
        scopeOpts() {
            return this.scope === 'tenant' ? {} : { instanceId: this.$store.state.currentInstanceId }
        },
        async load() {
            this.loading = true
            this.dirty = false
            try {
                const res = await this.post('api/readFile', {
                    target: this.node.fullPath,
                    encoding: this.encoding,
                    ...this.scopeOpts()
                })
                if (res.data.code === 0) {
                    this.loadedContent = res.data.data.content
                    this.loadedEncoding = res.data.data.encoding || 'utf-8'
                    this.encoding = this.loadedEncoding
                    if (this.editor) this.editor.setValue(this.loadedContent)
                } else {
                    this.$message.error(res.data.msg || '读取失败')
                }
            } catch (e) {
                this.$message.error('读取请求失败：' + (e && e.message ? e.message : e))
            } finally {
                this.loading = false
            }
        },
        // 切换编码：若有未保存修改先确认（切换会按新编码重新读取，丢弃本地改动），随后重新读取
        async onEncodingChange(val) {
            if (this.dirty) {
                try {
                    await this.$confirm('切换编码将按新编码重新读取文件，未保存的修改会丢失，是否继续？', '提示', { type: 'warning' })
                } catch (e) {
                    this.encoding = this.loadedEncoding
                    return
                }
            }
            this.load()
        },
        onOpened() {
            if (this.editor) {
                this.editor.setValue(this.loadedContent)
                return
            }
            this.editor = monaco.editor.create(this.$refs.editor, {
                value: this.loadedContent || '',
                language: langFromName(this.node && this.node.name),
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 13,
                tabSize: 4,
                minimap: { enabled: true },
                scrollBeyondLastLine: false
            })
            this.editor.onDidChangeModelContent(() => {
                this.dirty = this.editor.getValue() !== this.loadedContent
            })
        },
        onClose() {
            if (this.editor) {
                this.editor.dispose()
                this.editor = null
            }
            this.loadedContent = ''
            this.dirty = false
            this.encoding = 'utf-8'
            this.loadedEncoding = 'utf-8'
        },
        async save() {
            if (!this.editor) return
            this.saving = true
            try {
                const res = await this.post('api/writeFile', {
                    target: this.node.fullPath,
                    content: this.editor.getValue(),
                    encoding: this.encoding,
                    ...this.scopeOpts()
                })
                if (res.data.code === 0) {
                    this.loadedContent = this.editor.getValue()
                    this.dirty = false
                    this.$message.success('保存成功')
                    this.$emit('saved')
                } else {
                    this.$message.error(res.data.msg || '保存失败')
                }
            } catch (e) {
                this.$message.error('保存请求失败：' + (e && e.message ? e.message : e))
            } finally {
                this.saving = false
            }
        }
    }
}
</script>
<style lang="less" scoped>
    .editor-meta {
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        .editor-path {
            color: #909399;
            font-size: 12px;
            word-break: break-all;
            flex: 1 1 auto;
            margin-right: 12px;
        }
        .encoding-select {
            flex: 0 0 auto;
            width: 160px;
        }
        .encoding-label {
            flex: 0 0 auto;
            margin-right: 6px;
            color: #606266;
            font-size: 13px;
        }
        .encoding-hint {
            flex: 0 0 auto;
            color: #909399;
            font-size: 12px;
        }
    }
    .editor-wrap {
        height: 70vh;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        overflow: hidden;
    }
    .monaco-editor {
        width: 100%;
        height: 100%;
    }
</style>

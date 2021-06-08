<template>
    <div>
        <div ref="container" style="height:800px"></div>
    </div>
</template>
<script>
import * as monaco from 'monaco-editor'
export default {
    data() {
        return {
            monacoEditor: {}
        }
    },
    mounted() {
        console.log('啊啊啊', this.monacoEditor)
        // 初始化编辑器，确保dom已经渲染，dialog中要写在opened中
        this.monacoEditor = monaco.editor.create(this.$refs.container, {
            value: `var name = {
}
console.log(name)`,
            readOnly: false,
            language: 'JavaScript',
            wordBasedSuggestions: true,
            wordBasedSuggestionsOnlySameLanguage: true,
            theme: 'vs-dark'
        })
    },
    methods: {
        changeEditor() { // 更改editor内容
            // result.data
            this.monacoEditor.setValue()
            this.monacoEditor.getAction('editor.action.formatDocument')._run()
        },
        destroyEditor() { // 销毁编辑器
            this.monacoEditor.dispose()
        }
    }
}
</script>
<style lang="sass">
</style>
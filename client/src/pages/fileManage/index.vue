<template>
    <div class="file-manage">
        <FileManage scope="tenant" />
    </div>
</template>
<script>
import FileManage from '@/pages/file'
export default {
    components: { FileManage }
}
</script>
<style lang="less">
.file-manage {
    padding: 12px;
}
</style>

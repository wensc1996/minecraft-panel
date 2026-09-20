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
<style lang="less" scoped>
.file-manage {
    // padding: 12px;
    overflow: hidden;
    height: 100%;
}
</style>

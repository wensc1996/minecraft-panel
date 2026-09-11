<template>
    <div class="instance-detail">
        <ServicePanel></ServicePanel>
    </div>
</template>
<script>
import ServicePanel from '@/pages/service/servicePanel'
export default {
    components: {
        ServicePanel
    },
    computed: {
        instanceId () {
            return this.$route.params.instanceId
        }
    },
    methods: {
        // 关键：将路由中的 instanceId 同步到全局 store，面板组件据此加载数据；
        // 刷新页面时路由参数仍在，故刷新后仍定位到当前实例
        syncInstance () {
            this.$store.commit('SETINSTANCE', this.instanceId)
        }
    },
    watch: {
        instanceId () {
            this.syncInstance()
        }
    },
    mounted () {
        this.syncInstance()
    }
}
</script>
<style lang="less">
.instance-detail {
    padding: 12px;
}
</style>

<template>
    <div>
        <div class="container">
            <ServicePanel></ServicePanel>
        </div>
        <div class="container">
            <QuickOperation></QuickOperation>
        </div>
        <div class="container">
            <CmdPanel></CmdPanel>
        </div>
    </div>
</template>
<script>
import ServicePanel from '@/pages/service/servicePanel'
import QuickOperation from '@/pages/service/quickOperation'
import CmdPanel from '@/pages/service/cmdPanel'
export default {
    components: {
        ServicePanel,
        QuickOperation,
        CmdPanel
    }
}
</script>
<style lang="scss">
</style>
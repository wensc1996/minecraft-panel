<template>
    <div id="app">
        <router-view/>
    </div>
</template>

<script>
export default {
    name: 'App',
    mounted() {
        window.addEventListener('unload', this.saveState)
    },
    methods: {
        saveState () {
            sessionStorage.setItem('state', JSON.stringify(this.$store.state))
        }
    }
}
</script>

<style lang="less">
@import url('./assets/global.less');
@import url('./assets/common.less');
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

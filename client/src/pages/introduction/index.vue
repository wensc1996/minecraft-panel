<template>
  <div class="log">
      <p v-for="(item, index) in msgContainer" v-bind:key="index">{{item.msg}}</p>
  </div>
</template>
<script>
export default {
    data () {
        return {
            msgContainer: [],
            id: ''
        }
    },
    methods: {
    },
    mounted () {
        this.$socket.emit('chat', '你好')
    }
    // sockets: {
    //     // 这里是监听connect事件
    //     connect: function () {
    //         // 接收服务端发来的推送
    //         this.id = this.$socket.id
    //     },
    //     // 方法名与服务端的保持一致
    //     res: function (res) {
    //     // 以下对接收来的数据进行操作
    //         this.msgContainer.push({
    //             msg: res
    //         })
    //     }
    // }
}
</script>
<style lang="scss">
    .log{
        font-size: 16px;
        p{
            padding: 5px 0;
        }
    }
</style>
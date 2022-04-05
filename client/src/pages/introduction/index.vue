<template>
    <div introduction>
        <div class="container-box">
            <div class="title"><h3>项目技术</h3></div>
            <div class="content">
                <h4>框架</h4>
                <p>web前端采用vue+webpack+element+scss+node平台搭建前端工程</p>
                <p>web后端采用egg+webpack+node平台搭建后端工程</p>
                <p>数据库使用mysql 8.0</p>
                <el-divider></el-divider>
                <h4>java进程与Node进程通信</h4>
                <p>在利用node启动java进程中，使用了spawn来创建子进程，spawn特点在于大数据量，且在解析数据编码的过程中，能正确转化，exec转化出现乱码问题</p>
                <p>在spawn子进程与父进程之间的通信通过创建输入输出流控制，即可完成对命令行的读写操作</p>
                <p>node父进程接收到数据之后，结合使用socket.io来将数据分发给客户端，这里的主动权掌控在服务端，即服务端推送，客户端接收，非客户端主动请求</p>
                <el-divider></el-divider>
                <h4>客户端与服务端桥接过程</h4>
                <p>客户端通过node搭建的前端工程访问，利用webpack反向代理到本地服务端后台请求（测试环境），利用nginx实现反向代理（生产环境）</p>
                <p>访问node与java的通信组件之前，将所有客户端全部加入wensc房间，然后socket消息推送会推送到该房间，如果不加入房间，每一个人会进入不同的房间，则会出现消息不同步</p>
                <p>前端工程使用vue-socket.io来接收socket消息，socket.io会智能判断当前支持的长连接方式，使用长轮询或者websocket或者iframe，轮询劣势很突出，页面卡顿严重，故此使用websocket</p>
                <p>egg与mysql的连接使用egg-mysql插件来完成</p>
                <p>本项目基本全部结合async await异步队列来实现功能，非阻塞，高并发</p>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    data () {
        return {
        }
    },
    methods: {
    },
    mounted () {
    }
}
</script>
<style lang="less">
    div[introduction]{
        .container-box{
            margin: 10px 0;
            background-color:#f1f1f1;
            .title{
                border-left: 3px solid #1fb199;
                padding:5px 0;
                padding-left: 20px;
                background-color:#d1d1d1;
            }
            .content{
                padding:5px;
                p{
                    padding: 3px 0;
                }
            }
        }
    }
</style>
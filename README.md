# minecraft-panel
我的世界控制面板(MITE专版)
可一键随机TP,一键重生，纪录所有坐标点，一键T人，分角色分权限管理后台，指定角色操作文件，指定角色只能TP，多种权限控制方案

+ 安装教程参考https://pan.baidu.com/s/12XOm8YtB_7wKiGblpKdAdg?pwd=MITE，提取码MITE
+ 前端采用vue+element开发
+ 后端采用node环境搭配egg
+ 数据库使用mysql
+ node与MC桥连接通过node spawn子进程启动java,socket.io实现客户端与服务端通信

# 安装附件说明
+ 下载安装Mysql 5.7：https://downloads.mysql.com/archives/get/p/25/file/mysql-installer-community-5.7.43.0.msi
+ 下载安装NodeJS v18：https://nodejs.org/dist/v18.20.6/node-v18.20.6-x64.msi
+ 安装Navicat以及破解

# 如果前端页面需要nginx（webpack形式用移动端访问会崩掉）
### 进入client目录，输入指令npm run build 然后把该目录文件转移到文件夹，例如C:\Users\Administrator\Desktop\minecraft-panel-master\client-dist
``` nginx
server {
        listen 21091;
        server_name localhost;
		
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection "upgrade";

	location / {
		#前端页面打包之后的路径文件夹
		root C:\Users\Administrator\Desktop\minecraft-panel-master\client-dist;
	}
	#后端接口转发
	location ~ ^/wensc/(.*)$ {
		proxy_pass http://127.0.0.1:7002/$1;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}
	#websocket转发
	location /socket.io{
		proxy_pass http://127.0.0.1:7002;    #将server_name的请求转发到81端口
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	}
    }
```

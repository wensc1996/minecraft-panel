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
### 进入client目录，输入指令npm run build 然后把client/dist目录下面文件转移到文件夹，例如C:\Users\Administrator\Desktop\minecraft-panel-master\client-dist
``` nginx
server {
        listen 21091;
        server_name localhost;
		
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection "upgrade";

	location / {
		#前端页面打包之后的目标路径文件夹
		root C:\Users\Administrator\Desktop\minecraft-panel-master\client-dist;
	}
	#后端接口转发
	location ~ ^/api/(.*)$ {
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

# 初始使用说明

## 1. 默认账号

首次部署导入 `mcpanel.sql` 后，数据库已内置以下账号（密码均为 `123456`，即 `md5('123456') = e10adc3949ba59abbe56e057f20f883e`）：

- **平台管理员**：账号 `admin` / 密码 `123456`（`tenant_id = 0`，`role_id = 1`）
  - 拥有全部平台级权限：新增/删除实例、管理 JAVA 字典、开通/停用租户、查看监控看板、跨租户分配权限等。
- **默认租户管理员**：账号 `123456` / 密码 `123456`（`tenant_id = 1`，`role_id = 4`）
  - 仅管理「默认租户（tenant_id = 1）」内的实例与用户，无平台级操作权限。

> 首次部署后建议尽快修改 `admin` 与默认租户管理员的密码。

## 2. 启动前置

1. 安装并启动 MySQL 5.7，导入 `mcpanel.sql` 建库（含平台管理员、默认租户、默认租户管理员的初始化数据）。
2. 启动后端（默认监听端口 `7002`，`0.0.0.0`）。
3. 前端按需配置 nginx（监听 `21091`），将 `/api/*` 与 `/socket.io` 转发到后端 `127.0.0.1:7002`（配置示例见上方 nginx 段）。

## 3. 配置 JAVA 字典（必做）

实例启动依赖 Java 可执行文件路径，该路径存放在平台级字典表 `sys_dict`（`dict_type = 'java_path'`）。数据库初始化时该字典为空，**启动任何实例前必须先配置**，否则实例无法启动。

- **方式一：通过界面（需以平台管理员登录）**
  进入「服务 / 实例管理」页面，在 JAVA 路径下拉框旁点击「新增」，填写：
  - `dictValue`：Java 可执行文件**完整路径**（如 Linux `/usr/lib/jvm/java-17-openjdk/bin/java`，Windows `C:\Java\jdk17\bin\java.exe`）
  - `dictName`：展示名称（可留空，默认同路径）
  保存后即可在下拉框中选择该 JAVA 路径。
- **方式二：直接写数据库（仅平台管理员可新增/删除字典项）**
  ```sql
  INSERT INTO sys_dict (dict_type, dict_key, dict_value, dict_name)
  VALUES ('java_path', '<唯一键>', '<java完整路径>', '<展示名>');
  ```

> 注意：只有平台管理员可执行字典的新增/删除；删除已被实例引用的 JAVA 路径会导致相关实例无法启动。

## 4. 新建实例需要平台管理员账号

新增 / 删除实例为**平台级操作，仅平台管理员（`admin`）可执行**，租户管理员及普通租户用户无此权限（接口返回「仅平台管理员可新增实例」）。

新建实例需填写：
- 实例名称：仅支持中文、字母、数字，同租户下唯一（同时作为工作目录名）。
- 游戏端口（`game_port`）：全服唯一。
- JAR 包名、内存（最大/最小）、启动模式（jar / raw 原始参数）。
- JAVA 路径：选择第 3 步字典中的一项。
- 实例到期时间（`expire_at`）：仅平台管理员可设置/修改。

实例工作目录 = 租户 `storage_path` + 实例名称，由后端自动创建，**不落库**；展示/启动时按 `storage_path + name` 拼接。

## 5. 默认租户存储目录

- 默认租户（`tenant_id = 1`，名称「默认租户」）的 `storage_path = '../workspace'`（相对 `server` 目录）。
- 可在「平台管理」中修改存储根目录；开通新租户时若未填写，默认使用 `/data/mcpanel/tenants/<tenant_id>`。
- 文件管理顶级入口与实例工作目录均以该存储根目录为根。

## 6. 其他注意事项

- 账号全局唯一（`uk_account`）；平台管理员以 `tenant_id = 0` 标识，登录后 `isPlatformAdmin = true`。
- `player_id` 为游戏内玩家 ID，用于「随机 TP / 重生 / T 人」等游戏内操作绑定。平台管理员 `admin` 默认绑定 `wensc`，若与实际玩家名不符可在 `user` 表自行调整。
- 权限隔离：平台管理员可跨租户分配 `tenant` 级权限；租户仅能管理本租户的角色与用户，提交 `platform` 级权限会被丢弃。
- JAVA 字典为全平台共享（无 `tenant_id` 隔离），任意租户实例均从同一份 `java_path` 字典中选择。

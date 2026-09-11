# 多租户与游戏实例隔离 —— 需求改造文档

> 适用范围：minecraft-panel（Egg.js + MySQL）
> 状态：需求设计与方案确认稿（数据库连接层改造已完成，多租户部分待落地）

---

## 1. 背景与目标

当前系统为**单租户**结构：`user / role / privilege / menu / location / logs / dispose` 全部全局共享，其中 `dispose`（游戏配置）甚至是**全局唯一一条**，且 `mcbridge` 中的 Minecraft 服务端进程是**单全局实例**。

业务目标：

- 平台方（服务商）只有一个，等价于**平台管理员**（单一超级管理员账号）。
- 平台下可有**多个租售方（租户 / tenant）**，每个租户拥有**独立的完整功能**：
  - 自身的角色管理、用户管理、权限分配；
  - 自身可**新增并保存多个服务器实例**，且能**同时运行多个实例**；
  - 每个服务器实例拥有独立的游戏配置（`dispose` / `server_instance`）与**独立运行的 Minecraft 服务端进程**（不同端口 / 工作目录）。
- 同一自然人可出现在多个分组（租户）中：使用同一个**自定义账号**登录，登录时**选择要进入的分组**。

---

## 2. 总体架构选型

| 维度 | 选型 | 理由 |
|---|---|---|
| 数据隔离 | **共享同一 `mcpanel` 库 + 行级 `tenant_id` 字段隔离**（非每租户独立 database） | 数据量小、单库单应用、运维与改造成本最低 |
| 游戏实例 | **范围 B：每租户内多实例并发 MC 进程**（已与需求方确认） | 需求明确"独立完整功能含游戏配置"，且租户登录后控制面板展示多个实例卡片，点击进入单实例控制台/管理 |
| 平台管理员 | 单一账号，`tenant_id = 0` 作为约定标记，复用现有超级管理员角色 | 服务商仅一个，无需多服务商层级 |
| 连接层 | 已完成：共享连接池单例（`query` / `transaction`） | 见第 3 节 |

---

## 3. 已完成：数据库连接层改造（基线）

`server/src/mysql/connection.js` 已重构为进程内**连接池单例**，对外暴露：

- `query(sql, params)`：单条 SQL，自动从池取/还连接；
- `transaction(sqlTasks)`：同一连接上的事务（任一失败回滚）；
- `closePool()`：优雅退出时回收；
- 配置支持环境变量覆盖（`MYSQL_HOST/PORT/USER/PASSWORD/DATABASE/CONNECTION_LIMIT`），默认与原值一致。

所有 service / `logger` / `gameConfig` 已统一改为 `const db = require('.../connection')` 后调用 `db.query(...)`，移除了原先"每条 SQL 新建/销毁 TCP 连接"及 `batchAction`/`closeMysql` 手工管理。

---

## 4. 数据模型改造（SQL 草案）

### 4.1 新增租户表

```sql
CREATE TABLE `tenant` (
  `tenant_id`   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_name` VARCHAR(50)  NOT NULL,
  `storage_path` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '租户服务器存储根目录',
  `status`      TINYINT(1)   DEFAULT 1,          -- 1启用 0停用
  `expire_at`   DATETIME     NULL,
  `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenant_id`)
);
```
存储目录规则：
- `storage_path` 为该租户专用的服务器文件根目录（如 `/data/mcpanel/tenants/<tenant_id>`）；
- **平台默认租户（`tenant_id = 0`）** 使用统一配置项 `DEFAULT_TENANT_STORAGE_PATH`（默认 `/data/mcpanel/servers`），不占用租户子目录；
- 新建服务器实例（`dispose`）时，系统在该 `storage_path` 下自动创建**子目录**作为实例工作目录：`work_path = ${storage_path}/<实例name>`（目录名由实例 name 清洗得到，name 仅含中文/字母/数字）；`work_path` 不落库，启动时按 `storage_path + name` 拼接；
- `TenantService` 开通租户时需 `mkdir(storage_path)` 确保根目录存在（失败则回滚开通，避免脏数据）。

### 4.2 业务表加 `tenant_id`

```sql
ALTER TABLE `user`      ADD COLUMN `tenant_id` INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `role`      ADD COLUMN `tenant_id` INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `privilege` ADD COLUMN `tenant_id` INT UNSIGNED NOT NULL DEFAULT 0;
-- dispose 升级为"服务器实例配置表"：每条记录 = 一个 MC 实例（见 4.4）
ALTER TABLE `dispose`
  ADD COLUMN `instance_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
  ADD COLUMN `tenant_id`  INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN `name`       VARCHAR(50) NOT NULL DEFAULT '服务器实例',
  ADD UNIQUE KEY `uk_tenant_instance` (`tenant_id`, `instance_id`);
ALTER TABLE `location`  ADD COLUMN `tenant_id` INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `logs`      ADD COLUMN `tenant_id` INT UNSIGNED NOT NULL DEFAULT 0;
-- menu 表保持全局共享（功能菜单定义，各租户角色引用同一套）
```

### 4.3 用户表加自定义账号 `account`

```sql
ALTER TABLE `user`
  ADD COLUMN `account` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '自定义登录账号',
  ADD UNIQUE KEY `uk_tenant_account` (`tenant_id`, `account`);
```

- `user_id`：保留为全局唯一主键（自增），作为唯一标识；
- `account`：登录用自定义账号；`UNIQUE(tenant_id, account)` 保证**同一租户内唯一、跨租户可重复**；
- `player_id`：保留为游戏内 ID，与登录账号解耦；
- 形态示例：用户"小明"在租户 1、2 各有一条 user 记录 —— `user_id` 分别为 1001/2001，`account` 均为 `'xiaoming'`，`tenant_id` 分别为 1/2，密码可各自独立。

### 4.4 层级关系小结

| 层级 | 表 | 关键字段 | 说明 |
|---|---|---|---|
| 平台管理员 | `user`（`tenant_id = 0`） | — | 单一超级管理员，管理租户 |
| 租户（用户组） | `tenant` | `tenant_id` | 多个；租户间数据隔离 |
| 服务器实例 | `dispose`（实例配置表） | `instance_id` + `tenant_id` | 每租户**多个**，可同时运行，每实例一 MC 进程；工作目录 = `tenant.storage_path/<实例name>`（name 仅含中文/字母/数字） |

---

## 5. 用户与鉴权设计

### 5.1 分层

- **平台管理员**：`user.tenant_id = 0`（现有超级管理员角色 `role_id = 1`），登录后 `session.tenantId = 0`，路由到平台后台；其接口校验 `ctx.tenantId === 0` 才放行租户管理。
- **租户账号**：`tenant_id > 0`，登录后 `session.tenantId = 该租户`；其用户 / 角色 / 配置 / 坐标全部按 `tenant_id` 隔离；其下**多个服务器实例**按 `instance_id` 进一步归属该租户。

### 5.2 隔离铁律

> `tenant_id` 只能由登录态（`session`）决定，**绝不能信任前端传入的参数**，否则可被篡改越权访问其他租户。

- 新增 `app/middleware/tenant.js`：从 `ctx.session` 取出 `tenantId` 挂到 `ctx`，业务接口强制校验已登录。
- 所有业务 SQL 必须带 `WHERE tenant_id = ?`，参数取自 `ctx.tenantId`。

### 5.3 登录选组流程（`login.js`）

`find(options)` 改为按 `account` 定位，支持"选组"：

1. 带了 `tenantId`：`WHERE tenant_id = ? AND account = ?`，校验密码后登录该租户。
2. 没带 `tenantId`：`SELECT * FROM user WHERE account = ?`（可能命中多租户）：
   - 逐条比对密码（`md5`）：
     - 0 条匹配 → 登录失败（不泄露存在哪些租户）；
     - 1 条匹配 → 直接登录该租户，`session.tenantId = 该条.tenant_id`；
     - ≥2 条匹配 → 返回 `code: 2` "请选择登录分组"，附带可选项 `tenant_id` / `tenant_name` 列表（不含敏感字段），前端二次提交带 `tenantId`。

---

## 6. 服务器实例隔离（范围 B / `mcbridge.js`）

层级为 **平台 → 租户(tenant) → 服务器实例(instance)**。每个租户可新增多个实例并**同时运行**，因此隔离粒度下探到 `instance_id`。当前 `mcbridge.js` 模块级 `java` / `serverStatus` / `playerList` / `messageQueue` 为单值，必须改为"以实例为 key"的运行上下文。

### 6.1 运行上下文 Map 化（按 instanceId）

```js
const runtimes = new Map(); // instanceId -> { java, serverStatus, playerList, messageQueue }
function getRuntime(instanceId) {
  if (!runtimes.has(instanceId)) {
    runtimes.set(instanceId, { java: null, serverStatus: 0, playerList: [], messageQueue: [] });
  }
  return runtimes.get(instanceId);
}
```

### 6.2 房间按实例拆分 —— 必须

原代码所有 `emit` 写死 `room = 'wensc'`，多实例会互相泄露控制台/玩家/状态。改为：

```js
function instanceRoom(instanceId) { return 'instance_' + instanceId; }
```

- 所有 `to(room)` → `to(instanceRoom(instanceId))`；
- `joinRoom(instanceId)`：`ctx.socket.join(instanceRoom(instanceId))`，且**必须校验该实例归属当前 `session.tenantId`**（防越权进入他人实例）；
- **客户端同样以实例 id 为准**：`joinRoom` 必须携带 `instanceId`（来自当前选中的实例卡片），`thread`（发指令）也需携带 `instanceId`；服务端据此把 socket 加入 `instance_<id>` 房间并将指令写入该实例 `runtimes.get(id).java.stdin`。消息事件名（如 `wensc`）保持不变，仅按房间隔离；
- **room 命名铁律**：房间名唯一基准为 `instance_<instance_id>`，服务端推送与客户端收发统一使用该房间；注意 `wensc` 此处仅是历史 HTTP 路由前缀 / socket 消息事件名，不可再用作房间名。
- `initialJava` 闭包捕获 `instanceId`，使 `java.stdout` 回调推到对应实例房间；
- **每个实例各自的 `messageQueue` + 各自的推送定时器**（放在 `runtimes.get(instanceId)` 中），不可再用全局单一 `setInterval`；
- 不必再按功能（控制台/状态/玩家）拆房间，消息仍用 `type` 字段区分。

### 6.3 实例管理接口（替代原单例 beginProcess/killProcess/thread/serverStatus）

- 列实例卡片：`GET /server-instances` → `SELECT * FROM dispose WHERE tenant_id = ?`（本租户全部实例；运行时状态由 `runtimes` 映射补充）；
- 新增/保存实例：`POST /server-instances`（写入 `dispose`：name / game_port / java_dict_id / jar_name / 内存等；`work_path` 不落库，由 `tenant.storage_path + name` 拼接）；
- 启动：`POST /server-instances/:id/start` → `initialJava(instanceId)`；
- 停止：`POST /server-instances/:id/stop` → 给 `runtimes.get(id).java` 发 `SIGINT`；
- 状态：读 `runtimes.get(id).serverStatus`；
- 控制台：`socket` 加入 `instance_<id>` 房间；`thread(instanceId)` 写 `runtimes.get(id).java.stdin`。

> 所有实例操作接口必须校验 `instance.tenant_id === ctx.tenantId`，否则拒绝（越权防护）。

### 6.4 端口与目录分配（隔离前提）

每个实例的 `dispose` 仅存 `java_dict_id`（关联 `sys_dict.dict_type='java_path'`），真实的 JAVA 路径/名称在启动与展示时关联 `sys_dict` 查询；`work_path` 不落库，由后端按 `tenant.storage_path + name` 拼接；其余参数含 `game_port` / `jar_name` / 内存，作为启动该实例 MC 进程的参数。

- 新增实例时由平台/租户分配：`game_port` 在**全服唯一**端口池中取（跨租户也可能同机）；工作目录 `work_path = tenant.storage_path + '/' + <实例name>`（name 仅含中文/字母/数字，多实例并列子目录互不干扰）；
- 新增/修改实例增加**端口 / 名称唯一性校验**：更新前查库确认 `game_port` 未被其他实例占用、实例 `name` 同租户唯一（name 即目录名，故目录天然不冲突），否则拒绝；

### 6.5 进程守护与优雅退出

- 每实例 `java.on('close')` 仅重置自身 runtime（`serverStatus = 0`、`playerList = []`、广播给该实例房间），不影响其他实例；
- 应用退出时遍历 `runtimes` 给每个 `java` 发 `SIGINT`：在 `app.js` 的 `beforeClose` 钩子里统一回收（与 `closePool()` 同一处）。

### 6.6 平台管理员

游戏操作接口不对其开放，不进任何实例房间；平台监控走单独只读 REST 接口遍历 `runtimes` Map 返回各租户 / 各实例状态。

---

## 7. 各模块改造映射

| 模块 | 改造点 |
|---|---|
| `login.js` | 登录写 `session.tenantId`；按 `account` 定位 + 选组流程 |
| `user.js` | 列表/新增/改/删全部带 `tenant_id` 条件与写入 |
| `role` / `privilege.js` | `getRolePrivilege` / `updatePrivilege`（事务）带 `tenant_id` |
| `dispose.js`（→ 实例配置 Service） | 复用为服务器实例配置服务：`select/update` 按 `tenant_id` + `instance_id`；新增/保存实例；`work_path` 不落库，由后端按 `tenant.storage_path + name` 生成，前端不手填；加端口/名称唯一性校验 |
| `location.js` / `logs.js` | 带 `tenant_id` + `instance_id` 条件（坐标/日志归属到具体服务器实例） |
| `mcbridge.js` | 全局变量 → `runtimes` Map（key = instanceId）；房间按 `instance_<id>` + per-instance 定时器；实例 CRUD / 启停 / 控制台接口 |
| 新增 | `tenant` 中间件、`TenantService`（开通租户、初始化角色/权限、生成租户管理员账号）、`ServerInstanceService`（实例 CRUD / 端口分配 / 启停）、`app.js`（优雅退出） |

---

## 8. 前端配合点（非 server 单方面）

1. 登录后按 `session.tenantId` 路由到"平台后台"或"租户后台"；
2. 收到 `code: 2` 时弹出"选择登录分组"，选完带 `tenantId` 重新登录；
3. 租户后台"控制面板"菜单展示**多个服务器实例卡片**（来自 `GET /server-instances`），点击某实例进入该实例的控制台 / 状态 / 指令页；**当前选中实例的 `instanceId` 作为后续所有 socket 通信的基准**；
4. **socket 房间以 instanceId 为准（joinRoom）**：进入实例页时 `emit('joinRoom', { instanceId })`（前端不传 tenantId，仅传来自卡片点击的 `instanceId`）；服务端校验该实例归属当前租户后将其加入 `instance_<id>` 房间；客户端监听消息事件（如 `wensc`）即可收到该房间推送，天然按实例隔离；
5. **发指令以 instanceId 为准（thread）**：所有指令（`cmdPanel` / `servicePanel` / `quickOperation` 等）统一 `emit('thread', { instanceId, cmd })`，必须携带 `instanceId`，服务端据此写入对应实例 `runtimes.get(id).java.stdin`；
6. 启停 / 指令 / 日志面板只针对当前实例，且服务端校验该实例属于当前租户。
7. **控制面板 + 实例操作面板**：
   - 侧边"控制面板"进入两栏页——左栏为运行实例列表（`GET /server-instances`，本租户 `dispose` 全量）；右栏为该租户**存储工作目录文件树**（根 = `tenant.storage_path`，其下并列多个 `<实例name>` 子目录，即各实例工作目录）。
   - 点击左栏某实例（携带 `instanceId`）下钻进入该实例的**操作面板**（`/home/service` 作为下级页面），面板内四个**平级 tab**：
     1. 状态管理（控制台 / 在线玩家 / serverStatus，原 `CmdPanel` + `QuickOperation`）；
     2. 坐标管理（原 `servicePanel` 坐标部分 `getLocation` / `addLocation` / `deleteLocation`）；
     3. 配置管理（实例游戏配置，原 `servicePanel` 设置部分 `updateGameDispose`）；
     4. **文件管理（从原顶级菜单 `/home/file` 移入）**：展示**该实例**内的文件树，根 = `tenant.storage_path/<实例name>`，与状态 / 坐标 / 配置平级。
   - 因此 `/home/file` 不再作为侧边顶级菜单，归入实例操作面板；其展示范围从"全局 work_path"收拢为"选中实例目录"，天然按实例隔离。
   - 后端：`getDirectoryOrFile` 依赖的全局 `GameConfig.work_path` 改为按 `tenant.storage_path/instance_<id>`（由 `instanceId` + `ctx.tenantId` 校验归属后确定，**路径只来自库，绝不接收前端传入路径**）；并新增"租户存储目录树"接口支撑右栏多实例并列展示。

---

## 9. 落地里程碑

- **M1 数据模型与隔离骨架（已完成）**：`mcpanel.sql`（`tenant` 表 + 各表 `tenant_id` / `instance_id` + `account` 唯一索引 + `dispose` 升为实例配置表 `instance_id/tenant_id/name` + `location`/`logs` 带 `instance_id`）+ `status` 表已移除（无实际用途）；新建 `app/middleware/tenant.js` 强制从 `session` 取 `tenantId` 挂 `ctx`；所有业务路由串联该中间件；登录 `find` 实现"账号定位 + 选组"流程并写 `session.tenantId`，`logout` 清理；日志写入带 `tenant_id`。下一步 M2 把各业务 SQL 用 `ctx.tenantId`/`ctx` 上的实例信息。
- **M2 业务数据隔离**：`user / role / privilege / dispose / location / logs` 查询与写入带 `tenant_id` / `instance_id`；`TenantService` 租户开通与初始化（开通时 `mkdir(storage_path)` 并复制默认角色/权限到该 `tenant_id`）。
- **M3 服务器实例隔离**：`dispose` 实例配置 CRUD；新建实例时在 `tenant.storage_path` 下以实例 `name`（仅中文/字母/数字）建子目录作为 `work_path`；`mcbridge.js` → `runtimes` Map（key = instanceId）+ 房间按 `instance_<id>` + 实例启停/控制台接口 + 端口/名称分配与校验 + 优雅退出。
- **M4 平台管理后台**：租户列表 / 启用停用 / 监控看板；登录选组前端。
- **M5 实例前端**：控制面板实例卡片列表 + 点击进入单实例控制台/管理。

---

## 10. 待确认 / 风险

- `account` 是否直接复用现有 `player_id`（推荐新建独立 `account` 列，语义更清晰）；
- 端口分配策略：实例级 `game_port` 需**全服唯一**（建议端口池/区间），目录根 `MC_ROOT` 由部署决定；
- 单机上多实例 MC 进程的资源限制（CPU / 内存上限按 `max_memory_size` 控制，防止某实例吃满机器）；
- 日志隔离与审计：是否需要平台侧统一查看各租户 `logs`，以及实例级日志（`op_time` + `instance_id`）。

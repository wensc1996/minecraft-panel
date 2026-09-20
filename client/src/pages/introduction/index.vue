<template>
    <div class="introduction">
        <!-- 顶部 Hero -->
        <section class="hero">
            <div class="hero-inner">
                <span class="hero-badge">Minecraft 服务器运维平台</span>
                <h1 class="hero-title">MCPANEL</h1>
                <p class="hero-sub">一体化 Minecraft 服务器管理面板 · 实例控制 · 文件管理 · 多租户权限</p>
                <div class="hero-actions">
                    <el-button type="primary" size="medium" round @click="goService">
                        <i class="el-icon-video-play"></i> 进入控制面板
                    </el-button>
                    <el-button size="medium" round plain @click="goArch">查看系统架构</el-button>
                </div>
                <ul class="hero-stats">
                    <li><strong>6+</strong><span>功能模块</span></li>
                    <li><strong>3 级</strong><span>权限粒度</span></li>
                    <li><strong>实时</strong><span>WebSocket 推送</span></li>
                    <li><strong>多租户</strong><span>数据隔离</span></li>
                </ul>
            </div>
        </section>

        <!-- 核心特性 -->
        <section class="section">
            <div class="section-head">
                <h2>核心功能模块</h2>
                <p>覆盖 Minecraft 服务器从运行、文件到人员与权限的全流程管理</p>
            </div>
            <div class="grid grid--3">
                <div class="feature-card" v-for="(m, i) in modules" :key="i">
                    <div class="feature-icon" :style="{ background: m.bg }">
                        <i :class="m.icon"></i>
                    </div>
                    <div class="feature-body">
                        <h3>{{ m.title }}</h3>
                        <p>{{ m.desc }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 技术架构 -->
        <section class="section" id="arch" ref="arch">
            <div class="section-head">
                <h2>技术架构</h2>
                <p>前后端分离、Node 驱动、实时双向通信的现代全栈方案</p>
            </div>
            <el-row :gutter="16" class="card-grid">
                <el-col v-for="(t, i) in techStack" :key="i" :xs="24" :sm="12" :md="12" :lg="6">
                    <div class="tech-card" :style="{ '--accent': t.color }">
                        <div class="tech-head">
                            <i :class="t.icon"></i>
                            <span>{{ t.title }}</span>
                        </div>
                        <ul class="tech-list">
                            <li v-for="(it, j) in t.items" :key="j">{{ it }}</li>
                        </ul>
                    </div>
                </el-col>
            </el-row>
        </section>

        <!-- 系统架构数据流 -->
        <section class="section">
            <div class="section-head">
                <h2>系统数据流</h2>
                <p>请求链路与实时推送链路，服务端主动推送、客户端被动接收</p>
            </div>
            <div class="flow-wrap">
                <div class="flow-block">
                    <div class="flow-label"><i class="el-icon-top-right"></i> 请求链路（REST）</div>
                    <div class="flow">
                        <template v-for="(s, i) in requestFlow">
                            <span class="flow-node">{{ s }}</span>
                            <i v-if="i < requestFlow.length - 1" class="el-icon-right flow-arrow"></i>
                        </template>
                    </div>
                </div>
                <div class="flow-block">
                    <div class="flow-label flow-label--live"><i class="el-icon-connection"></i> 实时链路（Socket.IO）</div>
                    <div class="flow">
                        <template v-for="(s, i) in realtimeFlow">
                            <span class="flow-node flow-node--live">{{ s }}</span>
                            <i v-if="i < realtimeFlow.length - 1" class="el-icon-right flow-arrow flow-arrow--live"></i>
                        </template>
                    </div>
                </div>
            </div>
        </section>

        <!-- 权限模型 -->
        <section class="section">
            <div class="section-head">
                <h2>权限模型（RBAC）</h2>
                <p>基于角色的访问控制，支持三级粒度分配，平台与租户两级作用域</p>
            </div>
            <el-row :gutter="16" class="card-grid">
                <el-col v-for="(p, i) in permissions" :key="i" :xs="24" :sm="8" :md="8" :lg="8">
                    <div class="perm-card">
                        <span class="perm-tag" :class="p.cls">{{ p.level }}</span>
                        <h3>{{ p.title }}</h3>
                        <p>{{ p.desc }}</p>
                    </div>
                </el-col>
            </el-row>
        </section>

        <footer class="intro-foot">
            MCPANEL · 基于 Vue + Egg.js + MySQL 构建 · 服务端推送架构
        </footer>
    </div>
</template>

<script>
export default {
    data () {
        return {
            modules: [
                { icon: 'el-icon-video-play', title: '控制面板', desc: '服务器实例启停、控制台指令输入、在线玩家踢出/传送/重生', bg: 'linear-gradient(135deg,#10a8b3,#1E73A3)' },
                { icon: 'el-icon-folder', title: '文件管理', desc: '目录创建、文件上传、在线编辑、解压与打包下载', bg: 'linear-gradient(135deg,#1fb199,#10a8b3)' },
                { icon: 'el-icon-user', title: '用户管理', desc: '账号、游戏 ID 与密码维护，支持租户级账号体系', bg: 'linear-gradient(135deg,#1E73A3,#2d8cf0)' },
                { icon: 'el-icon-unlock', title: '角色与权限', desc: 'RBAC 三级权限（菜单 / 页签 / 按钮）灵活分配', bg: 'linear-gradient(135deg,#E6A23C,#f5a623)' },
                { icon: 'el-icon-document', title: '日志管理', desc: '操作审计与行为追溯，按租户隔离记录', bg: 'linear-gradient(135deg,#909399,#606266)' },
                { icon: 'el-icon-s-platform', title: '平台后台', desc: '多租户隔离、租户状态管控与全局概览', bg: 'linear-gradient(135deg,#10a8b3,#13c2c2)' }
            ],
            techStack: [
                { icon: 'el-icon-monitor', title: '前端', color: '#10a8b3', items: ['Vue 2 + Vue Router', 'Webpack 工程化构建', 'Element UI 组件库', 'Less 样式体系', 'vue-socket.io 实时通信'] },
                { icon: 'el-icon-cpu', title: '后端', color: '#1E73A3', items: ['Egg.js 企业级框架', 'Node.js 运行时', 'async / await 异步', 'REST + Socket 双通道'] },
                { icon: 'el-icon-coin', title: '数据库', color: '#1fb199', items: ['MySQL 关系型存储', 'egg-mysql 连接管理', '用户 / 角色 / 权限表', '日志与租户隔离'] },
                { icon: 'el-icon-connection', title: '实时通信', color: '#E6A23C', items: ['Socket.IO 房间推送', 'spawn 管理 Java 进程', 'stdio 流读写控制', '服务端主动推送'] }
            ],
            requestFlow: ['浏览器客户端 (Vue)', '反向代理 (Nginx / Webpack)', 'Egg 后端服务', 'MySQL 数据库'],
            realtimeFlow: ['Egg 后端', 'spawn Java 进程 (MC 服务)', 'Socket.IO 推送', '客户端实时刷新'],
            permissions: [
                { level: '菜单级', title: '页面可见性', desc: '控制角色可访问的顶级页面与菜单项', cls: 'perm-menu' },
                { level: '页签级', title: 'Tab 可见性', desc: '控制面板内控制台、在线玩家等页签开关', cls: 'perm-tab' },
                { level: '按钮级', title: '操作权限', desc: '创建 / 删除 / 编辑 / 下载等细粒度按钮控制', cls: 'perm-btn' }
            ]
        }
    },
    methods: {
        goService () {
            this.$router.push('/home/service')
        },
        goArch () {
            if (this.$refs.arch && this.$refs.arch.scrollIntoView) {
                this.$refs.arch.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }
    }
}
</script>

<style lang="less" scoped>
.introduction {
    // 设计 token
    --primary: #1E73A3;
    --teal: #10a8b3;
    --accent: #1fb199;
    --grad: linear-gradient(135deg, #10a8b3, #1E73A3);
    --text-1: #1f2d3d;
    --text-2: #5c6b7a;
    --text-3: #98a6b3;
    --line: #ebeef5;
    --radius: 12px;
    --shadow-sm: 0 1px 2px rgba(16, 36, 64, .06);
    --shadow-md: 0 4px 16px rgba(16, 36, 64, .08);

    color: var(--text-1);
    font-size: 14px;
    line-height: 1.6;

    // ===== Hero =====
    .hero {
        background: var(--grad);
        border-radius: var(--radius);
        padding: 40px 32px;
        color: #fff;
        box-shadow: var(--shadow-md);
        position: relative;
        overflow: hidden;
        &::after {
            content: "";
            position: absolute;
            right: -60px;
            top: -60px;
            width: 220px;
            height: 220px;
            background: rgba(255, 255, 255, .08);
            border-radius: 50%;
        }
    }
    .hero-inner {
        position: relative;
        z-index: 1;
        max-width: 760px;
    }
    .hero-badge {
        display: inline-block;
        font-size: 12px;
        padding: 3px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, .18);
        border: 1px solid rgba(255, 255, 255, .25);
        margin-bottom: 14px;
    }
    .hero-title {
        font-size: 40px;
        font-weight: 700;
        letter-spacing: 2px;
        margin: 0 0 8px;
    }
    .hero-sub {
        font-size: 15px;
        opacity: .92;
        margin: 0 0 22px;
    }
    .hero-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        /deep/ .el-button--primary {
            background: #fff;
            border-color: #fff;
            color: var(--primary);
            font-weight: 600;
        }
        /deep/ .el-button--primary:hover {
            background: rgba(255, 255, 255, .9);
        }
        /deep/ .el-button--plain {
            color: #fff;
            border-color: rgba(255, 255, 255, .6);
        }
        /deep/ .el-button--plain:hover {
            background: rgba(255, 255, 255, .12);
            color: #fff;
        }
    }
    .hero-stats {
        list-style: none;
        display: flex;
        gap: 32px;
        margin: 28px 0 0;
        padding: 0;
        flex-wrap: wrap;
        li {
            display: flex;
            flex-direction: column;
        }
        strong {
            font-size: 22px;
            font-weight: 700;
        }
        span {
            font-size: 12px;
            opacity: .85;
            margin-top: 2px;
        }
    }

    // ===== 通用 section =====
    .section {
        margin-top: 28px;
    }
    .section-head {
        margin-bottom: 16px;
        h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 4px;
            position: relative;
            padding-left: 12px;
            &::before {
                content: "";
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 18px;
                border-radius: 2px;
                background: var(--grad);
            }
        }
        p {
            margin: 0;
            color: var(--text-3);
            font-size: 13px;
            padding-left: 12px;
        }
    }
    .card-grid {
        margin-bottom: 4px;
    }
    .grid {
        display: flex;
        flex-wrap: wrap;
        margin: 0 -8px;
        align-items: stretch;
    }
    .grid > * {
        margin: 8px;
        box-sizing: border-box;
        min-width: 0;
    }
    .grid--2 > * { flex: 1 1 calc((100% - 16px) / 2); }
    .grid--3 > * { flex: 1 1 calc((100% - 32px) / 3); }
    .grid--4 > * { flex: 1 1 calc((100% - 48px) / 4); }
    @media (max-width: 1100px) {
        .grid--4 > * { flex-basis: calc((100% - 32px) / 2); }
    }
    @media (max-width: 900px) {
        .grid--3 > * { flex-basis: calc((100% - 32px) / 2); }
        .grid--2 > * { flex-basis: 100%; }
    }
    @media (max-width: 600px) {
        .grid--3 > * , .grid--4 > * { flex-basis: 100%; }
    }

    // ===== 功能卡片 =====
    .feature-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 18px;
        height: 100%;
        box-shadow: var(--shadow-sm);
        transition: transform .2s ease, box-shadow .2s ease;
        &:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-md);
        }
    }
    .feature-icon {
        flex: 0 0 auto;
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 22px;
    }
    .feature-body {
        h3 {
            margin: 2px 0 6px;
            font-size: 15px;
            font-weight: 600;
        }
        p {
            margin: 0;
            color: var(--text-2);
            font-size: 13px;
        }
    }

    // ===== 技术卡片 =====
    .tech-card {
        background: #fff;
        border: 1px solid var(--line);
        border-top: 3px solid var(--accent);
        border-radius: var(--radius);
        padding: 18px;
        height: 100%;
        box-shadow: var(--shadow-sm);
    }
    .tech-head {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 15px;
        color: var(--accent);
        margin-bottom: 12px;
        i {
            font-size: 20px;
        }
    }
    .tech-list {
        list-style: none;
        margin: 0;
        padding: 0;
        li {
            position: relative;
            padding: 5px 0 5px 16px;
            font-size: 13px;
            color: var(--text-2);
            &::before {
                content: "";
                position: absolute;
                left: 0;
                top: 12px;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--accent);
            }
        }
    }

    // ===== 数据流 =====
    .flow-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .flow-block {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 18px;
        box-shadow: var(--shadow-sm);
    }
    .flow-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--primary);
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
        &--live {
            color: #E6A23C;
        }
    }
    .flow {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    }
    .flow-node {
        background: #f4f8fb;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 13px;
        color: var(--text-1);
        white-space: nowrap;
        &--live {
            background: #fdf6ec;
            border-color: #faecd8;
            color: #b8760d;
        }
    }
    .flow-arrow {
        color: var(--primary);
        font-weight: 700;
        &--live {
            color: #E6A23C;
        }
    }

    // ===== 权限卡片 =====
    .perm-card {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 18px;
        height: 100%;
        box-shadow: var(--shadow-sm);
        h3 {
            margin: 10px 0 6px;
            font-size: 15px;
            font-weight: 600;
        }
        p {
            margin: 0;
            color: var(--text-2);
            font-size: 13px;
        }
    }
    .perm-tag {
        display: inline-block;
        font-size: 12px;
        padding: 2px 10px;
        border-radius: 999px;
        &.perm-menu { color: #409EFF; background: #ecf5ff; }
        &.perm-tab { color: #67C23A; background: #f0f9eb; }
        &.perm-btn { color: #E6A23C; background: #fdf6ec; }
    }

    // ===== 页脚 =====
    .intro-foot {
        margin-top: 32px;
        padding-top: 18px;
        border-top: 1px solid var(--line);
        text-align: center;
        color: var(--text-3);
        font-size: 12px;
    }
}

@media (max-width: 768px) {
    .introduction .hero {
        padding: 28px 20px;
    }
    .introduction .hero-title {
        font-size: 30px;
    }
    .introduction .hero-stats {
        gap: 20px;
    }
}
</style>

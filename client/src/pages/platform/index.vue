<template>
    <div class="platform-page">
        <el-row :gutter="16" class="stat-cards">
            <el-col :span="6">
                <el-card shadow="hover"><div class="stat-label">总租户数</div><div class="stat-value">{{ summary.tenantTotal }}</div></el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover"><div class="stat-label">启用 / 停用</div><div class="stat-value">{{ summary.tenantEnabled }} / {{ summary.tenantDisabled }}</div></el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover"><div class="stat-label">实例总数</div><div class="stat-value">{{ summary.instanceTotal }}</div></el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover"><div class="stat-label">用户总数</div><div class="stat-value">{{ summary.userTotal }}</div></el-card>
            </el-col>
        </el-row>

        <el-row class="op-row">
            <el-button type="primary" @click="dialogVisible = true">新建租户</el-button>
        </el-row>

        <el-card class="table-card" shadow="never">
            <div slot="header">租户列表</div>
            <el-table :data="tenants" border stripe>
                <el-table-column prop="tenant_name" label="租户名称" min-width="120"></el-table-column>
                <el-table-column prop="storage_path" label="存储目录" min-width="200" show-overflow-tooltip></el-table-column>
                <el-table-column label="状态" width="90">
                    <template slot-scope="scope">
                        <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                            {{ scope.row.status === 1 ? '启用' : '停用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="instance_count" label="实例数" width="80"></el-table-column>
                <el-table-column prop="user_count" label="用户数" width="80"></el-table-column>
                <el-table-column prop="create_time" label="创建时间" min-width="160"></el-table-column>
                <el-table-column label="操作" width="100">
                    <template slot-scope="scope">
                        <el-button size="mini" :type="scope.row.status === 1 ? 'warning' : 'success'"
                                   @click="toggleStatus(scope.row)">
                            {{ scope.row.status === 1 ? '停用' : '启用' }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog title="新建租户" :visible.sync="dialogVisible" width="420px">
            <el-form :model="form" label-width="90px">
                <el-form-item label="租户名称">
                    <el-input v-model="form.tenantName" placeholder="如：张三的服务器"></el-input>
                </el-form-item>
                <el-form-item label="管理员账号">
                    <el-input v-model="form.account"></el-input>
                </el-form-item>
                <el-form-item label="管理员密码">
                    <el-input v-model="form.password" type="password"></el-input>
                </el-form-item>
                <el-form-item label="存储目录">
                    <el-input v-model="form.storagePath" placeholder="留空默认 /data/mcpanel/tenants/<id>"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitAdd">确定</el-button>
            </span>
        </el-dialog>
    </div>
</template>
<script>
export default {
    data () {
        return {
            summary: { tenantTotal: 0, tenantEnabled: 0, tenantDisabled: 0, instanceTotal: 0, userTotal: 0 },
            tenants: [],
            dialogVisible: false,
            form: { tenantName: '', account: '', password: '', storagePath: '' }
        }
    },
    mounted () {
        this.load()
    },
    methods: {
        async load () {
            let res = await this.get('wensc/dashboard')
            if (res.data.code === 0) {
                this.summary = res.data.data.summary
                this.tenants = res.data.data.list
            } else {
                this.tip(-1, res.data.msg)
            }
        },
        async toggleStatus (row) {
            let res = await this.post('wensc/updateTenantStatus', {
                tenantId: row.tenant_id,
                status: row.status === 1 ? 0 : 1
            })
            if (res.data.code === 0) {
                this.tip(1, '操作成功')
                this.load()
            } else {
                this.tip(-1, res.data.msg)
            }
        },
        async submitAdd () {
            if (!this.form.tenantName || !this.form.account || !this.form.password) {
                this.$message.warning('租户名称/管理员账号/密码必填')
                return
            }
            let res = await this.post('wensc/addTenant', this.form)
            if (res.data.code === 0) {
                this.tip(1, '开通租户成功')
                this.dialogVisible = false
                this.form = { tenantName: '', account: '', password: '', storagePath: '' }
                this.load()
            } else {
                this.tip(-1, res.data.msg)
            }
        }
    }
}
</script>
<style lang="less">
.platform-page {
    padding: 16px;
    .stat-cards {
        margin-bottom: 16px;
        .stat-label {
            color: #909399;
            font-size: 13px;
        }
        .stat-value {
            font-size: 22px;
            font-weight: 600;
            margin-top: 6px;
        }
    }
    .op-row {
        margin-bottom: 12px;
    }
    .table-card {
        .el-card__header {
            font-weight: 600;
        }
    }
}
</style>

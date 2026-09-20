<template>
    <div class="user-center">
        <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-trigger row ai-c">
                <div class="col">
                    <div>
                        <span class="user-sub">账号：</span>
                        <span class="user-account">{{ account }}</span>
                    </div>
                    <div>
                        <span class="user-sub">游戏ID：{{ playerId || '未设置' }}</span>
                    </div>
                </div>
                <span class="user-sub">租户：{{ tenantName }}</span>
                <i class="el-icon-caret-bottom"></i>
            </div>
            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="playerId">修改游戏ID</el-dropdown-item>
            </el-dropdown-menu>
        </el-dropdown>

        <!-- 修改密码：需先验证原密码 -->
        <el-dialog
            title="修改密码"
            :visible.sync="pwdVisible"
            width="30%"
            :close-on-click-modal="false"
            @closed="resetPwd">
        <el-form :model="pwdForm" label-width="90px">
            <el-form-item label="原密码">
                <el-input v-model="pwdForm.oldPassword" type="password" autocomplete="off"></el-input>
            </el-form-item>
            <el-form-item label="新密码">
                <el-input v-model="pwdForm.password" type="password" autocomplete="off"></el-input>
            </el-form-item>
            <el-form-item label="确认新密码">
                <el-input v-model="pwdForm.repassword" type="password" autocomplete="off"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button @click="pwdVisible = false">取消</el-button>
            <el-button type="primary" :loading="pwdSaving" @click="submitPassword">确定</el-button>
        </span>
    </el-dialog>

    <!-- 修改游戏ID -->
    <el-dialog
        title="修改游戏ID"
        :visible.sync="pidVisible"
        width="30%"
        :close-on-click-modal="false"
        @closed="resetPid">
        <el-form :model="pidForm" label-width="90px">
            <el-form-item label="游戏ID">
                <el-input v-model="pidForm.playerId" placeholder="请输入游戏ID"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button @click="pidVisible = false">取消</el-button>
            <el-button type="primary" :loading="pidSaving" @click="submitPlayerId">确定</el-button>
        </span>
    </el-dialog>
    </div>
</template>
<script>
export default {
    data() {
        return {
            pwdVisible: false,
            pidVisible: false,
            pwdSaving: false,
            pidSaving: false,
            pwdForm: { oldPassword: '', password: '', repassword: '' },
            pidForm: { playerId: '' }
        }
    },
    computed: {
        info() {
            return this.$store.getters.GETUSERINFO || {}
        },
        account() {
            return this.info.account || ''
        },
        playerId() {
            return this.info.player_id || ''
        },
        tenantName() {
            return this.info.tenant_name || (this.info.tenant_id === 0 ? '平台' : '')
        }
    },
    methods: {
        handleCommand(cmd) {
            if (cmd === 'password') {
                this.pwdVisible = true
            } else if (cmd === 'playerId') {
                this.pidForm.playerId = this.playerId
                this.pidVisible = true
            }
        },
        resetPwd() {
            this.pwdForm = { oldPassword: '', password: '', repassword: '' }
        },
        resetPid() {
            this.pidForm = { playerId: '' }
        },
        async submitPassword() {
            if (!this.pwdForm.oldPassword) {
                this.$message.warning('请输入原密码')
                return
            }
            if (!this.pwdForm.password) {
                this.$message.warning('请输入新密码')
                return
            }
            if (this.pwdForm.password !== this.pwdForm.repassword) {
                this.$message.warning('两次新密码不一致')
                return
            }
            this.pwdSaving = true
            try {
                const res = await this.post('api/updateSelfPassword', this.pwdForm)
                this.tip(res.data.code, res.data.msg)
                if (res.data.code === 0) {
                    this.pwdVisible = false
                }
            } finally {
                this.pwdSaving = false
            }
        },
        async submitPlayerId() {
            if (!this.pidForm.playerId || !this.pidForm.playerId.trim()) {
                this.$message.warning('游戏ID不能为空')
                return
            }
            this.pidSaving = true
            try {
                const res = await this.post('api/updateSelfPlayerId', { playerId: this.pidForm.playerId.trim() })
                this.tip(res.data.code, res.data.msg)
                if (res.data.code === 0) {
                    // 更新本地 userInfo 的 player_id，使右上角即时刷新
                    const info = { ...this.$store.getters.GETUSERINFO, player_id: this.pidForm.playerId.trim() }
                    this.$store.commit('SETUSERINFO', info)
                    this.pidVisible = false
                }
            } finally {
                this.pidSaving = false
            }
        }
    }
}
</script>
<style lang="less" scoped>
    .user-center {
        margin-right: 16px;
        .user-trigger {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #fff;
            cursor: pointer;
            font-size: 13px;
            outline: none;
            .user-account {
                font-weight: 600;
            }
            .user-sub {
                opacity: .85;
                font-size: 12px;
            }
            .el-icon-caret-bottom {
                font-size: 12px;
            }
        }
    }
</style>

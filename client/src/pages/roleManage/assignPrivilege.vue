<template>
    <div class="assign-privilege">
        <div class="priv-legend">
            <span class="legend-item"><i class="dot dot-menu"></i>页面（菜单）</span>
            <span class="legend-item"><i class="dot dot-tab"></i>页签（Tab）</span>
            <span class="legend-item"><i class="dot dot-btn"></i>按钮</span>
            <span class="legend-item"><i class="dot dot-platform"></i>平台级</span>
        </div>
        <el-tree
            :data="privilege"
            show-checkbox
            node-key="perm_id"
            ref="tree"
            :props="defaultProps"
            :expand-on-click-node="false"
            :check-strictly="true"
            default-expand-all
            class="priv-tree">
            <span class="custom-node" slot-scope="{ node, data }">
                <i class="dot" :class="dotClass(data)"></i>
                <span class="node-label" :class="{ 'is-menu': data.perm_type === 'menu' }">{{ data.perm_name }}</span>
                <span class="tag" :class="tagClass(data)">{{ typeText(data.perm_type) }}</span>
                <span v-if="data.assign_scope === 'platform'" class="tag tag-platform">平台</span>
            </span>
        </el-tree>
    </div>
</template>
<script>
export default {
    data () {
        return {
            privilege: [],
            defaultProps: {
                children: 'children',
                label: 'perm_name',
                id: 'perm_id'
            }
        }
    },
    props: {
        roleId: ''
    },
    watch: {
        roleId: {
            handler: function(val) {
                this.getPrivilegeList()
            },
            immediate: true
        }
    },
    methods: {
        typeText(type) {
            if (type === 'menu') return '页面'
            if (type === 'tab') return '页签'
            return '按钮'
        },
        tagClass(data) {
            if (data.perm_type === 'menu') return 'tag-menu'
            if (data.perm_type === 'tab') return 'tag-tab'
            return 'tag-btn'
        },
        dotClass(data) {
            if (data.perm_type === 'menu') return 'dot-menu'
            if (data.perm_type === 'tab') return 'dot-tab'
            return 'dot-btn'
        },
        async getPrivilegeList() {
            if (this.privilege.length == 0) {
                let privilegeList = await this.get('api/getPrivilegeList')
                if (privilegeList.data.code == 0) {
                    this.privilege = privilegeList.data.data
                }
            }
            let rolePrivilege = await this.post('api/getRolePrivilege', {roleId: this.roleId})
            this.$refs.tree.setCheckedKeys(rolePrivilege.data.data.map(item => {
                return item.perm_id
            }))
        },
        async submitPrivilegeAssign() {
            let param = {
                roleId: this.roleId,
                privilgeList: this.$refs.tree.getCheckedKeys()
            }
            let res = await this.post('api/updatePrivilege', param)
            if (res.data.code == 0) {
                this.$notify({
                    title: '成功',
                    message: res.data.msg,
                    type: 'success'
                })
                this.$emit('closeAssignPrivilege')
            }
        }
    },
    mounted() {
    }
}
</script>
<style lang="less">
.assign-privilege {
    .priv-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-bottom: 10px;
        font-size: 12px;
        color: #909399;
        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
    }
    .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        display: inline-block;
        flex: 0 0 auto;
        &.dot-menu { background: #409EFF; }
        &.dot-tab { background: #67C23A; }
        &.dot-btn { background: #E6A23C; }
        &.dot-platform { background: #F56C6C; }
    }
    .priv-tree {
        max-height: 58vh;
        overflow: auto;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        padding: 6px 4px;
        background: #fff;
        .el-tree-node__content {
            height: 30px;
        }
    }
    .custom-node {
        display: flex;
        align-items: center;
        gap: 7px;
        .node-label {
            font-size: 13px;
            color: #606266;
            &.is-menu {
                font-weight: 600;
                color: #303133;
            }
        }
        .tag {
            font-size: 11px;
            line-height: 16px;
            padding: 0 7px;
            border-radius: 9px;
            border: 1px solid transparent;
            flex: 0 0 auto;
            &.tag-menu {
                color: #409EFF;
                background: #ecf5ff;
                border-color: #d9ecff;
            }
            &.tag-tab {
                color: #67C23A;
                background: #f0f9eb;
                border-color: #e1f3d8;
            }
            &.tag-btn {
                color: #E6A23C;
                background: #fdf6ec;
                border-color: #faecd8;
            }
            &.tag-platform {
                color: #F56C6C;
                background: #fef0f0;
                border-color: #fde2e2;
            }
        }
    }
}
</style>
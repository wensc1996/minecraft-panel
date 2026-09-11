// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'
import router from './router'
import ElementUI, { Dialog } from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VueSocketIO from 'vue-socket.io'
import Clipboard from 'clipboard'
import axios from 'axios'

Vue.prototype.$axios = axios
axios.defaults.withCredentials = true
// axios.defaults.baseURL = '/api'

Vue.config.productionTip = false

Vue.prototype.Clipboard = Clipboard

Vue.use(Vuex)
Vue.use(ElementUI)
// 全局禁止弹窗(el-dialog)点击遮罩(空白区域)关闭
if (Dialog && Dialog.props && Dialog.props.closeOnClickModal) {
  Dialog.props.closeOnClickModal.default = false
}
Vue.use(new VueSocketIO({
    debug: false,
    // 服务器端地址
    connection: '/',
    vuex: {}
}))
// 权限指令：无对应 perm_key 时隐藏元素（菜单/页签/按钮统一用 perm_key 鉴权）
Vue.directive('permission', {
    inserted (el, binding) {
        const key = binding.value
        const list = store.state.privileges || []
        const ok = list.some(p => p.perm_key === key || p.menu_func_name === key)
        if (!ok) el.style.display = 'none'
    }
})
const store = new Vuex.Store({
    state: sessionStorage.getItem('state') ? JSON.parse(sessionStorage.getItem('state')) : {
        // 大家可以把 state 想象成 组件中的 data ,专门用来存储数据的
        // 如果在 组件中，想要访问，store 中的数据，只能通过 this.$store.state.*** 来访问
        players: [],
        currentPosition: {},
        rebornType: '',
        userInfo: {},
        privileges: [],
        serverStatus: 0,
        currentInstanceId: ''
    },
    mutations: {
        SETSERVERSTATUS(state, val) {
            state.serverStatus = val
        },
        // 注意： 如果要操作 store 中的 state 值，只能通过 调用 mutations 提供的方法，才能操作对应的数据，不推荐直接操作 state 中的数据，因为 万一导致了数据的紊乱，不能快速定位到错误的原因，因为，每个组件都可能有操作数据的方法；
        // 注意： 如果组件想要调用 mutations 中的方法，只能使用 this.$store.commit('方法名')
        // 这种 调用 mutations 方法的格式，和 this.$emit('父组件中方法名')
        SETPLAYERS(state, val) {
            // 注意： mutations 的 函数参数列表中，最多支持两个参数，其中，参数1： 是 state 状态； 参数2： 通过 commit 提交过来的参数；
            state.players = val
        },
        SETCURRENTPOSITION(state, val) {
            state.currentPosition = val
        },
        SETREBORNTYPE(state, val) {
            state.rebornType = val
        },
        SETUSERINFO(state, val) {
            state.userInfo = val
        },
        SETPRIVILEGES(state, val) {
            state.privileges = val
        },
        SETINSTANCE(state, val) {
            state.currentInstanceId = val
        }
    },
    getters: {
        // 注意：这里的 getters， 只负责 对外提供数据，不负责 修改数据，如果想要修改 state 中的数据，请 去找 mutations
        GETPLAYERS: function (state) {
            return state.players
        },
        GETCURRENTPOSITION(state) {
            return state.currentPosition
        },
        GETREBORNTYPE(state) {
            return state.rebornType
        },
        GETUSERINFO(state) {
            return state.userInfo
        },
        GETPRIVILEGES(state) {
            return state.privileges
        }
        // 经过咱们回顾对比，发现 getters 中的方法， 和组件中的过滤器比较类似，因为 过滤器和 getters 都没有修改原数据， 都是把原数据做了一层包装，提供给了 调用者；
        // 其次， getters 也和 computed 比较像， 只要 state 中的数据发生变化了，那么，如果 getters 正好也引用了这个数据，那么 就会立即触发 getters 的重新求值；
    }
})

// 关键：将登录态(userInfo/privileges/currentInstanceId 等)变更持久化到 sessionStorage，
// 否则登录信息只存在内存，刷新页面即丢失，被后端 checkLoginStatusKeep 以 -999 踢回登录页
store.subscribe((mutation, state) => {
    try {
        sessionStorage.setItem('state', JSON.stringify(state))
    } catch (e) {}
})

Vue.mixin({
    methods: {
        get(url, data) {
            return new Promise((resolve, reject) => {
                axios({
                    url: url,
                    method: 'get',
                    params: data
                }).then((res) => {
                    if(res.data.code == -999) {
                        this.$router.push('/login')
                    } else {
                        resolve(res)
                    }
                })
            })
        },
        post(url, data) {
            return new Promise((resolve, reject) => {
                axios({
                    url: url,
                    method: 'post',
                    data: data
                }).then((res) => {
                    if(res.data.code == -999) {
                        this.$router.push('/login')
                    } else {
                        resolve(res)
                    }
                })
            })
        },
        tip(type, msg) {
            switch (type) {
                case 0:
                case 1:
                    this.$notify({
                        title: '成功',
                        message: msg,
                        type: 'success'
                    })
                    break
                case -1:
                    this.$notify.error({
                        title: '错误',
                        message: msg
                    })
                    break
                default:
                    this.$notify({
                        title: '警告',
                        message: msg,
                        type: 'warning'
                    })
                    break
            }
        },
        checkEnabled(name) {
            if (this.$store.getters.GETPRIVILEGES.find(item => {
                if (item.menu_func_name == name) {
                    return true
                } else {
                    return false
                }
            })) {
                return true
            } else {
                return false
            }
        },
        // 细粒度权限：按钮/页签级，按 perm_key 判断（与 v-permission 指令同源）
        hasPerm(key) {
            const list = this.$store.getters.GETPRIVILEGES || []
            return list.some(p => p.perm_key === key || p.menu_func_name === key)
        }
    }
})
Vue.prototype.$bus = new Vue()
/* eslint-disable no-new */
const app = new Vue({
    el: '#app',
    router,
    store,
    components: { App },
    template: '<App/>'
})
app._router.beforeEach((to, from, next) => {
    if (to.name === 'User' && !app.checkEnabled('userManage')) next(false)
    else if (to.name === 'PlayerFiles' && !app.checkEnabled('playerFiles')) next(false)
    else if (to.name === 'File' && !app.checkEnabled('uploadFile')) next(false)
    else if (to.name === 'FileManage' && !app.checkEnabled('fileManage')) next(false)
    else if (to.name === 'RoleManage' && !app.checkEnabled('roleManage')) next(false)
    else if ((to.name === 'Service' || to.name === 'ServiceInstance') && !app.checkEnabled('cmd')) next(false)
    else if (to.name === 'Logs' && !app.checkEnabled('logManage')) next(false)
    else if (to.name === 'Platform' && app.$store.getters.GETUSERINFO.tenant_id !== 0) next(false)
    else next()
})

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VueSocketIO from 'vue-socket.io'
import Clipboard from 'clipboard'
import axios from 'axios'

Vue.prototype.$axios = axios
// axios.defaults.baseURL = '/api'

Vue.config.productionTip = false

Vue.prototype.Clipboard = Clipboard

Vue.use(Vuex)
Vue.use(ElementUI)
Vue.use(new VueSocketIO({
    debug: false,
    // 服务器端地址
    connection: '/',
    vuex: {}
}))
const store = new Vuex.Store({
    state: sessionStorage.getItem('state') ? JSON.parse(sessionStorage.getItem('state')) : {
        // 大家可以把 state 想象成 组件中的 data ,专门用来存储数据的
        // 如果在 组件中，想要访问，store 中的数据，只能通过 this.$store.state.*** 来访问
        players: [],
        currentPosition: {},
        rebornType: '',
        userInfo: {},
        privileges: []
    },
    mutations: {
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

Vue.mixin({
    methods: {
        get(url, data) {
            return new Promise((resolve, reject) => {
                axios({
                    url: url,
                    method: 'get',
                    data: data
                }).then((res) => {
                    resolve(res)
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
                    resolve(res)
                })
            })
        },
        tip(type, msg) {
            switch (type) {
            case -1:
                this.$notify.error({
                    title: '错误',
                    message: msg
                })
                break
            case 0:
                this.$notify({
                    title: '警告',
                    message: msg,
                    type: 'warning'
                })
                break
            case 1:
                this.$notify({
                    title: '成功',
                    message: msg,
                    type: 'success'
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
        }
    }
})
Vue.prototype.$bus = new Vue()
/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    store,
    components: { App },
    template: '<App/>'
})

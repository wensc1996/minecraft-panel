import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/layout/home'
import Login from '@/pages/login'

Vue.use(Router)

export default new Router({
    routes: [{
        path: '',
        name: '',
        redirect: '/login'
    }, {
        path: '/login',
        name: 'Login',
        component: Login
    }, {
        path: '/home',
        name: 'Home',
        component: Home,
        children: [{
            path: 'introduction',
            name: 'Introduction',
            component: () => import(/* webpackChunkName: "introduction", webpackPrefetch: true */ '@/pages/introduction')
        }, {
            path: 'service',
            name: 'Service',
            component: () => import(/* webpackChunkName: "introduction", webpackPrefetch: true */ '@/pages/Service')
        }, {
            path: 'roleManage',
            name: 'RoleManage',
            component: () => import(/* webpackChunkName: "introduction", webpackPrefetch: true */ '@/pages/roleManage')
        }, {
            path: 'user',
            name: 'User',
            component: () => import(/* webpackChunkName: "introduction", webpackPrefetch: true */ '@/pages/user')
        }]
    }]
})

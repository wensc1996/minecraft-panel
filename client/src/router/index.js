import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/layout/home'
import Login from '@/pages/login'

Vue.use(Router)
const router = new Router({
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
            component: () => import(/* webpackChunkName: "service", webpackPrefetch: true */ '@/pages/service/index')
        }, {
            path: 'service/:instanceId',
            name: 'ServiceInstance',
            component: () => import(/* webpackChunkName: "service-instance", webpackPrefetch: true */ '@/pages/service/instance')
        }, {
            path: 'roleManage',
            name: 'RoleManage',
            component: () => import(/* webpackChunkName: "roleManage", webpackPrefetch: true */ '@/pages/roleManage')
        }, {
            path: 'user',
            name: 'User',
            component: () => import(/* webpackChunkName: "user", webpackPrefetch: true */ '@/pages/user')
        }, {
            path: 'fileManage',
            name: 'FileManage',
            component: () => import(/* webpackChunkName: "fileManage", webpackPrefetch: true */ '@/pages/fileManage')
        }, {
            path: 'logs',
            name: 'Logs',
            component: () => import(/* webpackChunkName: "logs", webpackPrefetch: true */ '@/pages/logs')
        }, {
            path: 'platform',
            name: 'Platform',
            component: () => import(/* webpackChunkName: "platform", webpackPrefetch: true */ '@/pages/platform')
        }]
    }]
})
export default router

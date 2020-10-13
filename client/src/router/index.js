import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/layout/home'

Vue.use(Router)

export default new Router({
    routes: [{
        path: '',
        name: '',
        redirect: '/home/introduction'
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
        }]
    }]
})

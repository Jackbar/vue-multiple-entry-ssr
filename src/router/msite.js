import Vue from 'vue'
import VueRouter from 'vue-router'

import msite from '~pages/msite/msite'

//后续会实现路由懒加载、滚动行为、过渡特效，
//再往后会考虑路由别名，比如 /u的别名为/user
Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: __dirname,
  routes: [
    { path: '/', redirect:'/msite'},
    { path: '/msite', name: 'h', component: msite}
  ]
})

export default router

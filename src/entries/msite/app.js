import Vue from 'vue'
import App from './App.vue'
// import store from '../../store'
import router from '~src/router/msite'
// import { sync } from 'vuex-router-sync'

// sync(store, router)

const app = new Vue({
  router,
  ...App
})

export { app, router }

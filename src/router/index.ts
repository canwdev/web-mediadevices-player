import {createRouter, createWebHashHistory} from 'vue-router'
import HomeView from '../App.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'HomeView',
      component: HomeView,
    },
  ],
})

export default router

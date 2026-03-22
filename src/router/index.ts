import {createRouter, createWebHashHistory} from 'vue-router'
import {version} from '../../package.json'
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

router.afterEach((to, from) => {
  document.title = `[${version}] Web MediaDevices Player`
})

export default router

import pkg from '../package.json'
import moment from 'moment/moment'

/**
 * 输出包版本信息
 */
// @ts-ignore
const timeDisplay = BUILD_TIMESTAMP ? moment(BUILD_TIMESTAMP).format('YYYY-MM-DD HH:mm:ss') : 'N/A'
console.info(
  `%c ${pkg.name} ${pkg.version} ${import.meta.env.MODE} %c ${timeDisplay} %c`,
  'background:#004C3F; border-radius: 3px 0 0 3px; padding:2px 0; color: #f9f9f9; font-size: 10px;',
  'background:#f9f9f9; border-radius: 0 3px 3px 0; padding:2px 0; color: #004C3F; font-size: 10px; font-weight: bold;',
  'background:transparent',
)

import './assets/main.css'
import {createApp} from 'vue'
import App from './App.vue'
import {createPinia} from 'pinia'
import router from './router'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

app.use(router)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

app.mount('#app')

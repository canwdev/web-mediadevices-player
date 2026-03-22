import moment from 'moment/moment'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import { createApp } from 'vue'
import pkg from '../package.json'

import App from './App.vue'
import i18n from './i18n'
import router from './router'
import './assets/main.scss'
import '@mdi/font/css/materialdesignicons.min.css'

/**
 * 输出包版本信息
 */
// @ts-expect-error
const timeDisplay = BUILD_TIMESTAMP ? moment(BUILD_TIMESTAMP).format('YYYY-MM-DD HH:mm:ss') : 'N/A'
console.info(
  `%c ${pkg.name} ${pkg.version} ${import.meta.env.MODE} %c ${timeDisplay} %c`,
  'background:#004C3F; border-radius: 3px 0 0 3px; padding:2px 0; color: #f9f9f9; font-size: 10px;',
  'background:#f9f9f9; border-radius: 0 3px 3px 0; padding:2px 0; color: #004C3F; font-size: 10px; font-weight: bold;',
  'background:transparent',
)

const app = createApp(App)

app.use(router)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
// use i18n
// @ts-expect-error
app.use(i18n)

app.mount('#app')

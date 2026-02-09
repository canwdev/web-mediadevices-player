import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN/index.json'
import enUS from './locales/en-US/index.json'

// 获取浏览器语言
const getBrowserLanguage = () => {
  const navigatorLanguage = navigator.language
  if (navigatorLanguage.includes('zh')) {
    return 'zh-CN'
  }
  return 'en-US'
}

const i18n = createI18n({
  legacy: false, // 必须设置为 false 才能使用 Composition API
  locale: getBrowserLanguage(), // 默认语言
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n

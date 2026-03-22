import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN/index.json'
import enUS from './locales/en-US/index.json'
import { useStorage } from '@vueuse/core'
import { watch } from 'vue'

export const localeList = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

// 获取浏览器语言
const getBrowserLanguage = () => {
  const navigatorLanguage = navigator.language
  if (navigatorLanguage.includes('zh')) {
    return 'zh-CN'
  }
  return 'en-US'
}

export const localeRef = useStorage('wmd__locale', getBrowserLanguage())
watch(localeRef, (newLocale) => {
  i18n.global.locale.value = newLocale
})

const i18n = createI18n({
  legacy: false, // 必须设置为 false 才能使用 Composition API
  locale: localeRef.value, // 默认语言
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export default i18n

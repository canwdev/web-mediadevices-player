<script lang="ts" setup>
import KvmPlayer from '@/components/KvmPlayer/KvmPlayer.vue'
import {addNotification} from '@/components/NotificationList/notification-list'
import {useI18n} from 'vue-i18n'

window.$notification = addNotification

const {t, locale} = useI18n()

const toggleLanguage = () => {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
}
</script>

<template>
  <div class="lang-switch">
    <span>{{ t('hello') }} - {{ t('welcome') }}</span>
    <button @click="toggleLanguage">{{ t('switchLanguage') }}</button>
  </div>
  <KvmPlayer />
</template>

<style scoped>
.lang-switch {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 4px;
  color: white;
  display: flex;
  gap: 10px;
  align-items: center;
}
button {
  cursor: pointer;
  padding: 2px 8px;
}
</style>

<script lang="ts" setup>
import KvmPlayer from '@/components/KvmPlayer/index.vue'
import {addNotification} from '@/components/NotificationList/notification-list'

window.$notification = addNotification
</script>

<template>
  <KvmPlayer />
</template>

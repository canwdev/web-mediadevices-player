<script lang="ts" setup>
import {toRefs} from 'vue'
import moment from 'moment'
import type {INotification} from '@/components/NotificationList/notification-list'
import NotifyItem from '@/components/NotificationList/NotifyItem.vue'

const props = defineProps<{
  notifications: INotification[]
}>()
const {notifications} = toRefs(props)

const removeNotification = (index: number) => {
  notifications.value.splice(index, 1)
}
</script>

<template>
  <div class="notification-list scrollbar-mini">
    <TransitionGroup name="list" tag="div" class="notification-container">
      <NotifyItem
        v-for="(item, index) in notifications"
        :key="item.timestamp"
        :item="item"
        @remove="removeNotification(index)"
      />
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.notification-list {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  padding: 10px;
  width: 300px;
  z-index: 1000;
  //scrollbar-gutter: stable both-edges;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  pointer-events: none;

  button {
    pointer-events: auto;
  }

  .notification-container {
    position: relative;
    list-style-type: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.list-move, /* 对移动中的元素应用的过渡 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 确保将离开的元素从布局流中删除
  以便能够正确地计算移动的动画。 */
.list-leave-active {
  position: absolute;
}
</style>

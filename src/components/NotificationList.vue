<script lang="ts" setup>
import {ref, onMounted} from 'vue'
import {useMainStore} from '@/stores/main'
import moment from 'moment'

// const props = defineProps<{
//   notifications: INotification[]
// }>()
// const {notifications} = toRefs(props)

const mainStore = useMainStore()

const removeNotification = (index: number) => {
  mainStore.notifications.splice(index, 1)
}

const test = () => {
  mainStore.addNotification({
    type: 'success',
    message: 'Test <NotificationList :notifications="mainStore.notifications" />',
  })
}

onMounted(() => {})

const formatTime = (t) => {
  return moment(t).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<template>
  <div class="notification-list scrollbar-mini">
    <button @click="test" v-show="false">Test</button>
    <TransitionGroup name="list" tag="ul" class="notification-container">
      <li
        class="notification-item"
        v-for="(item, index) in mainStore.notifications"
        :key="item.timestamp"
      >
        <div class="notification-item-inner panel-blur-bg">
          <div class="message-type" :class="item.type">{{ item.type }}</div>
          <div class="message-content">{{ item.message }}</div>
          <div class="message-time">{{ formatTime(item.timestamp) }}</div>
          <button class="btn-close" @click="removeNotification(index)">×</button>
        </div>
      </li>
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

  .notification-item {
    user-select: text;
    pointer-events: auto;

    .notification-item-inner {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 12px;
      border-radius: 5px;
      overflow: hidden;

      .btn-close {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 18px;
        color: inherit;
        position: absolute;
        top: 0;
        right: 0;
        user-select: none;
      }
    }

    .message-type {
      text-transform: capitalize;
      font-weight: bold;
      font-size: 12px;
      &.info {
        color: #1e90ff; // DodgerBlue
      }

      &.warning {
        color: #ffcc00; // Amber
      }

      &.success {
        color: #4caf50; // MediumSeaGreen
      }

      &.error {
        color: #f44336; // Red
      }
    }

    .message-content {
      word-break: break-word;
    }

    .message-time {
      font-size: 12px;
      opacity: 0.4;
    }
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

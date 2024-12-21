<script lang="ts" setup="">
import {INotification} from '@/components/NotificationList/notification-list'
import moment from 'moment/moment'
import {onMounted, ref, toRefs} from 'vue'

const props = withDefaults(
  defineProps<{
    item: INotification
  }>(),
  {},
)
const emit = defineEmits(['remove'])
const {item} = toRefs(props)
const formatTime = (t: number) => {
  return moment(t).format('YYYY-MM-DD HH:mm:ss')
}

const countdownMax = ref(0)
const countdownPercent = ref(100)
const timer = ref()
const isIn = ref(false)

onMounted(() => {
  if (item.value.timeout && item.value.timeout > 0) {
    countdownMax.value = item.value.timeout
    timer.value = setInterval(() => {
      if (isIn.value) {
        return
      }
      item.value.timeout -= 10

      countdownPercent.value = (item.value.timeout / countdownMax.value) * 100
      if (countdownPercent.value <= 0) {
        clearInterval(timer.value)
        emit('remove')
      }
    }, 10)
  }
})
</script>

<template>
  <div class="notification-item" @mouseenter="isIn = true" @mouseleave="isIn = false">
    <div class="notification-item-inner panel-blur-bg">
      <div class="message-type" :class="item.type">{{ item.type }}</div>
      <div class="message-content">{{ item.message }}</div>
      <div class="message-time">{{ formatTime(item.timestamp) }}</div>
      <button class="btn-close" @click="emit('remove')">×</button>

      <div v-if="countdownMax" class="countdown-bar">
        <div class="bar-inner" :style="{width: `${countdownPercent}%`}"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notification-item {
  user-select: text;
  pointer-events: auto;
  width: 100%;

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

    .countdown-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      overflow: hidden;
      .bar-inner {
        width: 0;
        height: 100%;
        background-color: gray;
      }
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
</style>

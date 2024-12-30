import {ref, createApp, h, App} from 'vue'
import NotificationList from './NotificationList.vue'

export interface INotification {
  type: 'info' | 'warning' | 'success' | 'error'
  message: string
  html: string
  timestamp: number
  timeout: number
}

const notifications = ref<INotification[]>([])

const push = (notification: Partial<INotification>) => {
  if (!notification.timestamp) {
    notification.timestamp = Date.now()
  }
  if (!notification.type) {
    notification.type = 'info'
  }
  if (!notification.timeout) {
    notification.timeout = 0
  }
  notifications.value.push(notification as INotification)
}

let app: App
const createComponent = () => {
  app = createApp({
    setup() {
      // 使用 render 函数代替 TSX
      return () => {
        return h(NotificationList, {
          notifications: notifications.value,
        })
      }
    },
  })

  const container = document.createElement('div')
  document.body.appendChild(container)
  app.mount(container)
}

export const addNotification = (notification: Partial<INotification>) => {
  if (!app) {
    createComponent()
  }
  push(notification)
}

// addNotification({
//   type: 'warning',
//   message: 'test message',
// })

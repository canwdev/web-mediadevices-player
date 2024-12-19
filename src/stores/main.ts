import {defineStore} from 'pinia'

export interface INotification {
  type?: 'info' | 'warning' | 'success' | 'error'
  message: string
  timestamp?: number
}

interface IStore {
  notifications: INotification[]
}

export const useMainStore = defineStore('main', {
  state: (): IStore => {
    return {
      notifications: [],
    }
  },
  actions: {
    addNotification(notification: INotification) {
      if (!notification.timestamp) {
        notification.timestamp = Date.now()
      }
      if (!notification.type) {
        notification.type = 'info'
      }
      this.notifications.push(notification)
    },
  },
})

import type { INotification } from '@/components/NotificationList/notification-list'

declare global {
  interface Window {
    $notification: (notification: Partial<INotification>) => void
  }
}

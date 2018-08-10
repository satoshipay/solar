import { observable, IObservableArray } from "mobx"

export type NotificationType = "error" | "success"

export interface Notification {
  id: number
  message: string
  type: NotificationType
}

const NotificationsStore: IObservableArray<Notification> = observable([])

export default NotificationsStore

let nextID = 1

function removeNotificationByID(notificationID: number) {
  const index = NotificationsStore.findIndex(notification => notification.id === notificationID)
  NotificationsStore.splice(index, 1)
}

export function addNotification(type: NotificationType, message: string) {
  const id = nextID++

  NotificationsStore.push({
    id,
    message,
    type
  })

  // just to prevent memory leaks; the NotificationContainer component determines when to hide
  setTimeout(() => {
    removeNotificationByID(id)
  }, 10000)
}

export function addError(error: any) {
  addNotification("error", String(error.message || error))

  // tslint:disable-next-line:no-console
  console.error(error)
}

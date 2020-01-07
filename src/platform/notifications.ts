import { Messages } from "../shared/ipc"
import { call } from "./ipc"

export async function hasPermission() {
  return (await call(Messages.NotificationPermission)) === "granted"
}

export function requestPermission() {
  return call(Messages.RequestNotificationPermission)
}

export async function showNotification(notification: LocalNotification, onClick?: () => void) {
  const canNotify = await hasPermission()

  if (canNotify) {
    call(Messages.ShowNotification, notification).then(onClick)
  } else {
    const granted = await requestPermission()
    if (granted) {
      call(Messages.ShowNotification, notification).then(onClick)
    }
  }
}

import { Messages } from "../shared/ipc"
import { call } from "./ipc"

function requestPermissionState() {
  return call(Messages.NotificationPermission)
}

function requestPermission() {
  return call(Messages.RequestNotificationPermission)
}

export function showNotification(notification: LocalNotification, onClick?: () => void) {
  requestPermissionState().then(state => {
    if (state === "granted") {
      call(Messages.ShowNotification, notification).then(onClick)
    } else {
      requestPermission().then(granted => {
        if (granted) {
          call(Messages.ShowNotification, notification).then(onClick)
        }
      })
    }
  })
}

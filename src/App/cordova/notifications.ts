import { Messages } from "../../../shared/ipc"
import { expose } from "./ipc"

function requestPermissionState() {
  return new Promise<boolean>(resolve => {
    cordova.plugins.notification.local.hasPermission(granted => resolve(granted))
  })
}

function requestPermission() {
  return new Promise<boolean>(resolve => {
    cordova.plugins.notification.local.requestPermission(granted => resolve(granted))
  })
}

let notificationID = 0

export function registerNotificationHandler() {
  expose(Messages.NotificationPermission, async () => {
    const hasPermission = await requestPermissionState()
    return hasPermission ? "granted" : "denied"
  })

  expose(Messages.RequestNotificationPermission, () => {
    return requestPermission()
  })

  expose(Messages.ShowNotification, (secureStorage, keyStore, notification) => {
    return new Promise<void>(resolve => {
      const id = notificationID++

      const handler = (clickedNotification: LocalNotification) => {
        if (clickedNotification.id === id) {
          cordova.plugins.notification.local.un("click", handler)
          resolve()
        }
      }
      cordova.plugins.notification.local.on("click", handler)

      const smallIcon = device && device.platform === "Android" ? "res://notif_icon.png" : undefined
      const color = "#02b8f5"

      cordova.plugins.notification.local.schedule({ color, id, smallIcon, ...notification })
    })
  })
}

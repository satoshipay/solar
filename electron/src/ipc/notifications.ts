import { Notification } from "electron"
import { expose } from "./_ipc"
import { Messages } from "../shared/ipc"

expose(Messages.NotificationPermission, () => {
  return Notification.isSupported() ? "granted" : "denied"
})

expose(Messages.RequestNotificationPermission, () => {
  // do nothing
  return false
})

expose(Messages.ShowNotification, localNotification => {
  return new Promise<void>(resolve => {
    const notification = new Notification({
      body: localNotification.text,
      ...localNotification
    })

    notification.show()

    notification.once("click", () => {
      resolve()
      notification.close()
    })
  })
})

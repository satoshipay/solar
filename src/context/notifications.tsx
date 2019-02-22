import React from "react"
import { useRef, useState } from "react"

export type NotificationType = "error" | "info" | "success"

export interface Notification {
  id: number
  message: string
  type: NotificationType
  onClick?: () => void
}

// tslint:disable-next-line
let trackErrorImplementation: (error: any) => void = console.error

export function trackError(error: any) {
  trackErrorImplementation(error)
}

interface NotificationOptions {
  onClick?: () => void
}

interface ContextValue {
  notifications: Notification[]
  showError(error: any): void
  showNotification(type: NotificationType, message: string, props?: NotificationOptions): void
}

interface Props {
  children: React.ReactNode
}

const NotificationsContext = React.createContext<ContextValue>({
  notifications: [],
  showError: () => undefined,
  showNotification: () => undefined
})

export function NotificationsProvider(props: Props) {
  // Not in the state, since state updates would be performed asyncronously
  const nextIDRef = useRef(1)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = (type: NotificationType, message: string, options: NotificationOptions = {}) => {
    const id = nextIDRef.current++

    setNotifications(prevNotifications => prevNotifications.concat({ ...options, id, message, type }))

    // just to prevent memory leaks; the NotificationContainer component determines when to hide
    setTimeout(() => removeNotificationByID(id), 10000)
  }

  const showError = (error: any) => {
    showNotification("error", String(error.message || error))

    // tslint:disable-next-line:no-console
    console.error(error)
  }

  const removeNotificationByID = (notificationID: number) => {
    setNotifications(prevNotifications => prevNotifications.filter(notification => notification.id !== notificationID))
  }

  trackErrorImplementation = showError

  const contextValue: ContextValue = {
    showError,
    showNotification,
    notifications
  }
  return <NotificationsContext.Provider value={contextValue}>{props.children}</NotificationsContext.Provider>
}

export { ContextValue as NotificationContextType, NotificationsContext }

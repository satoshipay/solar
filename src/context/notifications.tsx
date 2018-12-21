import React, { useRef, useState } from "react"

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
  addError(error: any): void
  addNotification(type: NotificationType, message: string, props?: NotificationOptions): void
}

interface Props {
  children: React.ReactNode
}

const NotificationsContext = React.createContext<ContextValue>({
  notifications: [],
  addError: () => undefined,
  addNotification: () => undefined
})

export function NotificationsProvider(props: Props) {
  // Not in the state, since state updates would be performed asyncronously
  const nextIDRef = useRef(1)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (type: NotificationType, message: string, options: NotificationOptions = {}) => {
    const id = nextIDRef.current++

    setNotifications(prevNotifications => prevNotifications.concat({ ...options, id, message, type }))

    // just to prevent memory leaks; the NotificationContainer component determines when to hide
    setTimeout(() => removeNotificationByID(id), 10000)
  }

  const addError = (error: any) => {
    addNotification("error", String(error.message || error))

    // tslint:disable-next-line:no-console
    console.error(error)
  }

  const removeNotificationByID = (notificationID: number) => {
    setNotifications(prevNotifications => prevNotifications.filter(notification => notification.id !== notificationID))
  }

  trackErrorImplementation = addError

  const contextValue: ContextValue = {
    addError,
    addNotification,
    notifications
  }
  return <NotificationsContext.Provider value={contextValue}>{props.children}</NotificationsContext.Provider>
}

export const NotificationsConsumer = NotificationsContext.Consumer

export { ContextValue as NotificationContextType, NotificationsContext }

import React from "react"
import { useTranslation } from "react-i18next"
import { getErrorTranslation } from "../lib/errors"

export type NotificationType = "connection" | "error" | "info" | "success"

export interface Notification {
  id: number
  message: string
  type: NotificationType
  onClick?: () => void
}

// tslint:disable-next-line
let trackConnectionErrorImplementation: (error: any) => void = console.error
// tslint:disable-next-line
let trackErrorImplementation: (error: any) => void = console.error

export function trackConnectionError(error: any) {
  trackConnectionErrorImplementation(error)
}

export function trackError(error: any) {
  trackErrorImplementation(error)
}

interface NotificationOptions {
  onClick?: () => void
}

interface ContextValue {
  notifications: Notification[]
  showConnectionError(error: any): void
  showError(error: any): void
  showNotification(type: NotificationType, message: string, props?: NotificationOptions): void
}

interface Props {
  children: React.ReactNode
}

const NotificationsContext = React.createContext<ContextValue>({
  notifications: [],
  showConnectionError: () => undefined,
  showError: () => undefined,
  showNotification: () => undefined
})

export function NotificationsProvider(props: Props) {
  // Not in the state, since state updates would be performed asyncronously
  const nextIDRef = React.useRef(1)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const { t } = useTranslation()

  const showNotification = (type: NotificationType, message: string, options: NotificationOptions = {}) => {
    const id = nextIDRef.current++

    setNotifications(prevNotifications => prevNotifications.concat({ ...options, id, message, type }))
  }

  const showConnectionError = (error: any) => {
    showNotification("connection", String(error.message || error))

    // tslint:disable-next-line:no-console
    console.error(error)
  }

  const showError = (error: any) => {
    showNotification("error", getErrorTranslation(error, t))

    // tslint:disable-next-line:no-console
    console.error(error)
  }

  trackConnectionErrorImplementation = showConnectionError
  trackErrorImplementation = showError

  const contextValue: ContextValue = {
    showConnectionError,
    showError,
    showNotification,
    notifications
  }
  return <NotificationsContext.Provider value={contextValue}>{props.children}</NotificationsContext.Provider>
}

export { ContextValue as NotificationContextType, NotificationsContext }

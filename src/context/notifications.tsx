import React from "react"

export type NotificationType = "error" | "info" | "success"

export interface Notification {
  id: number
  message: string
  type: NotificationType
  onClick?: () => void
}

let addErrorImplementation: (error: any) => void = () => undefined

export function addError(error: any) {
  addErrorImplementation(error)
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

interface State {
  notifications: Notification[]
}

const NotificationsContext = React.createContext<ContextValue>({
  notifications: [],
  addError: () => undefined,
  addNotification: () => undefined
})

export class NotificationsProvider extends React.Component<Props, State> {
  // Not in the state, since updates using `this.setState()` would be performed asyncronously
  nextID = 1

  state: State = {
    notifications: []
  }

  componentDidMount() {
    addErrorImplementation = this.addError
  }

  addNotification = (type: NotificationType, message: string, options: NotificationOptions = {}) => {
    const id = this.nextID++

    this.setState(state => ({
      notifications: state.notifications.concat({
        ...options,
        id,
        message,
        type
      })
    }))

    // just to prevent memory leaks; the NotificationContainer component determines when to hide
    setTimeout(() => {
      this.removeNotificationByID(id)
    }, 10000)
  }

  addError = (error: any) => {
    this.addNotification("error", String(error.message || error))

    // tslint:disable-next-line:no-console
    console.error(error)
  }

  removeNotificationByID = (notificationID: number) => {
    this.setState(state => ({
      notifications: state.notifications.filter(notification => notification.id !== notificationID)
    }))
  }

  render() {
    const contextValue: ContextValue = {
      addError: this.addError,
      addNotification: this.addNotification,
      notifications: this.state.notifications
    }
    return <NotificationsContext.Provider value={contextValue}>{this.props.children}</NotificationsContext.Provider>
  }
}

export const NotificationsConsumer = NotificationsContext.Consumer

export { ContextValue as NotificationContext }

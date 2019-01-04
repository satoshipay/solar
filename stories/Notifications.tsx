import React from "react"
import Button from "@material-ui/core/Button"
import { storiesOf } from "@storybook/react"
import NotificationContainer from "../src/components/NotificationContainer"
import { NotificationsContext, NotificationsProvider } from "../src/context/notifications"

function Buttons(props: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: React.Children.count(props.children) * 40,
        justifyContent: "space-between"
      }}
    >
      {props.children}
    </div>
  )
}

storiesOf("Notifications", module).add("All", () => (
  <NotificationsProvider>
    <NotificationContainer />
    <NotificationsContext.Consumer>
      {({ addError, addNotification }) => (
        <Buttons>
          <Button variant="contained" onClick={() => addError(new Error("An error happened."))}>
            Show error notification
          </Button>
          <Button variant="contained" onClick={() => addNotification("info", "This is an informational message.")}>
            Show info notification
          </Button>
          <Button variant="contained" onClick={() => addNotification("success", "Action successful!")}>
            Show success notification
          </Button>
          <Button
            variant="contained"
            onClick={() => addNotification("info", "Click me.", { onClick: () => window.alert("Clicked!") })}
          >
            Show clickable notification
          </Button>
        </Buttons>
      )}
    </NotificationsContext.Consumer>
  </NotificationsProvider>
))

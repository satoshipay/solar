import React from "react"
import Button from "@material-ui/core/Button"
import { storiesOf } from "@storybook/react"
import NotificationContainer from "../src/components/NotificationContainer"
import NotificationsStore, { addError, addNotification } from "../src/stores/notifications"

storiesOf("Notifications", module)
  .add("Error", () => (
    <div>
      <NotificationContainer notifications={NotificationsStore} />
      <Button variant="contained" onClick={() => addError(new Error("An error happened."))}>
        Show error notification
      </Button>
    </div>
  ))
  .add("Success", () => (
    <div>
      <NotificationContainer notifications={NotificationsStore} />
      <Button variant="contained" onClick={() => addNotification("success", "Action successful!")}>
        Show success notification
      </Button>
    </div>
  ))

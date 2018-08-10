import React from "react"
import Button from "@material-ui/core/Button"
import { storiesOf } from "@storybook/react"
import ErrorNotificationContainer from "../src/components/ErrorNotificationContainer"
import ErrorStore, { addError } from "../src/stores/errors"

storiesOf("Notifications", module).add("Error", () => (
  <div>
    <ErrorNotificationContainer errors={ErrorStore} />
    <Button variant="contained" onClick={() => addError(new Error("An error happened."))}>
      Trigger error
    </Button>
  </div>
))

import React from "react"
import { Server } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import ButtonIconLabel from "../ButtonIconLabel"
import { friendbotTopup } from "../../lib/stellar"
import { addError } from "../../stores/notifications"

interface Props {
  horizon: Server
  publicKey: string
}

interface State {
  pending: boolean
}

class FriendbotButton extends React.Component<Props, State> {
  state: State = {
    pending: false
  }

  topup = () => {
    return (async () => {
      try {
        this.setState({ pending: true })
        await friendbotTopup(this.props.horizon, this.props.publicKey)

        // Give the account subscription a little bit of time to recognize the account activation
        await new Promise(resolve => setTimeout(resolve, 2000))
      } finally {
        this.setState({ pending: false })
      }
    })().catch(addError)
  }

  render() {
    return (
      <Button variant="outlined" onClick={this.topup}>
        <ButtonIconLabel label="Request top-up from friendbot" loading={this.state.pending} />
      </Button>
    )
  }
}

export default FriendbotButton

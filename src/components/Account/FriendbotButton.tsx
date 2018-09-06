import React from "react"
import { Server } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
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
    ;(async () => {
      try {
        this.setState({ pending: true })
        await friendbotTopup(this.props.horizon, this.props.publicKey)
      } finally {
        this.setState({ pending: false })
      }
    })().catch(addError)
  }

  render() {
    return (
      <Button variant="outlined" onClick={this.topup}>
        {this.state.pending ? <CircularProgress size="1.5em" style={{ marginRight: 12 }} /> : null}
        Request top-up from friendbot
      </Button>
    )
  }
}

export default FriendbotButton

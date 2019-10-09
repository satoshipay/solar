import React from "react"
import { Server } from "stellar-sdk"
import Button, { ButtonProps } from "@material-ui/core/Button"
import ButtonIconLabel from "../ButtonIconLabel"
import { trackError } from "../../context/notifications"
import { friendbotTopup } from "../../lib/stellar"

interface Props {
  color?: ButtonProps["color"]
  horizon: Server
  publicKey: string
  variant?: ButtonProps["variant"]
}

function FriendbotButton(props: Props) {
  const [isPending, setPending] = React.useState(false)

  const topup = async () => {
    try {
      setPending(true)
      await friendbotTopup(props.horizon, props.publicKey)

      // Give the account subscription a little bit of time to recognize the account activation
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      trackError(error)
    } finally {
      setPending(false)
    }
  }

  return (
    // Extra padding especially for mobile
    <Button color={props.color} onClick={topup} variant={props.variant}>
      <ButtonIconLabel label="Ask the friendbot" loading={isPending} loaderColor="inherit" />
    </Button>
  )
}

export default FriendbotButton

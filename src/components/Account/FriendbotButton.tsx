import React from "react"
import { useState } from "react"
import { Server } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import ButtonIconLabel from "../ButtonIconLabel"
import { trackError } from "../../context/notifications"
import { friendbotTopup } from "../../lib/stellar"

interface Props {
  horizon: Server
  publicKey: string
}

function FriendbotButton(props: Props) {
  const [isPending, setPending] = useState(false)

  const topup = async () => {
    try {
      setPending(true)
      await friendbotTopup(props.horizon, props.publicKey)

      // Give the account subscription a little bit of time to recognize the account activation
      await new Promise(resolve => setTimeout(resolve, 2000))
    } finally {
      setPending(false)
    }
  }

  return (
    <Button variant="outlined" onClick={() => topup().catch(trackError)}>
      <ButtonIconLabel label="Request top-up from friendbot" loading={isPending} loaderColor="inherit" />
    </Button>
  )
}

export default FriendbotButton

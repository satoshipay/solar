import React from "react"
import CircularProgress from "@material-ui/core/CircularProgress"
import ThumbUpIcon from "@material-ui/icons/ThumbUp"
import { trackError } from "../../context/notifications"
import { friendbotTopup } from "../../lib/stellar"
import MainSelectionButton from "../Form/MainSelectionButton"

interface Props {
  className?: string
  horizonURL: string
  publicKey: string
  style?: React.CSSProperties
}

function FriendbotButton(props: Props) {
  const [isPending, setPending] = React.useState(false)

  const topup = async () => {
    try {
      setPending(true)
      await friendbotTopup(props.horizonURL, props.publicKey)

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
    <MainSelectionButton
      Icon={isPending ? CircularProgress : ThumbUpIcon}
      className={props.className}
      description="Get some free testnet lumens"
      label="Ask the friendbot"
      onClick={topup}
      style={props.style}
    />
  )
}

export default FriendbotButton

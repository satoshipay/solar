import React from "react"
import CircularProgress from "@material-ui/core/CircularProgress"
import ThumbUpIcon from "@material-ui/icons/ThumbUp"
import { trackError } from "~App/contexts/notifications"
import { friendbotTopup } from "~Generic/lib/stellar"
import MainSelectionButton from "~Generic/components/MainSelectionButton"

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

      // Do not reset the pending state – we want to see the spinner until we receive
      // the update and hide the whole friendbot button
    } catch (error) {
      setPending(false)
      trackError(error)
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

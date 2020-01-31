import React from "react"
import { WithdrawalStates } from "./statemachine"

interface Props {
  state: WithdrawalStates.KYCDenied
}

function WithdrawalKYCDenied(props: Props): never {
  const { response } = props.state
  const { transferServer } = props.state.withdrawal

  throw Error(
    `${transferServer.domain} has rejected the information about your person that you supplied. ` +
      `See ${response.more_info_url} for more details.`
  )
}

export default React.memo(WithdrawalKYCDenied)

import React from "react"
import { TransferStates } from "../util/statemachine"
import { Paragraph, Summary } from "./Sidebar"

interface Props {
  state: TransferStates.KYCDenied
}

function WithdrawalKYCDenied(props: Props): never {
  const { response } = props.state
  const { transferServer } = props.state.deposit! || props.state.withdrawal!

  throw Error(
    `${transferServer.domain} has rejected the information about your person that you supplied. ` +
      `See ${response.more_info_url} for more details.`
  )
}

const Sidebar = () => (
  <Summary headline="Know Your Customer">
    <Paragraph>You have been rejected – the service is disabled for you. Please contact the asset issuer.</Paragraph>
  </Summary>
)

const KYCDeniedView = Object.assign(React.memo(WithdrawalKYCDenied), { Sidebar })

export default KYCDeniedView

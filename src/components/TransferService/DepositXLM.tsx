import React from "react"
import { RefStateObject } from "../../hooks/userinterface"
import { VerticalLayout } from "../Layout/Box"
import { DepositContext } from "./DepositProvider"
import { Paragraph, Summary } from "./Sidebar"
import LumenDepositOptions from "../Deposit/LumenDepositOptions"

function DepositXLM() {
  const { account, actions } = React.useContext(DepositContext)

  return (
    <VerticalLayout alignItems="center" textAlign="center">
      <LumenDepositOptions account={account} onCloseDialog={actions.navigateBack} />
    </VerticalLayout>
  )
}

const Sidebar = () => (
  <Summary headline="Lumen deposit">
    <Paragraph>Deposit lumens</Paragraph>
    <Paragraph>We offer alternative options for lumen deposits that do not involve a Stellar asset issuer.</Paragraph>
  </Summary>
)

const DepositXLMView = Object.assign(React.memo(DepositXLM), { Sidebar })

export default DepositXLMView

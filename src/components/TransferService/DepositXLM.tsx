import React from "react"
import { VerticalLayout } from "../Layout/Box"
import { DepositContext } from "./DepositProvider"
import { Paragraph, Summary } from "./Sidebar"
import LumenDepositOptions from "../Deposit/LumenDepositOptions"

interface DepositXLMProps {
  onCloseDialog: () => void
}

function DepositXLM(props: DepositXLMProps) {
  const { account } = React.useContext(DepositContext)

  return (
    <VerticalLayout alignItems="center" textAlign="center">
      <LumenDepositOptions account={account} onCloseDialog={props.onCloseDialog} />
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

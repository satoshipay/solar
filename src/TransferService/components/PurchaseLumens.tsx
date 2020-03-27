import React from "react"
import { VerticalLayout } from "~Layout/components/Box"
import { DepositContext } from "./DepositProvider"
import { Paragraph, Summary } from "./Sidebar"
import LumenDepositOptions from "~LumenPurchase/components/LumenPurchaseOptions"

interface PurchaseLumensProps {
  onCloseDialog: () => void
}

function PurchaseLumens(props: PurchaseLumensProps) {
  const { account } = React.useContext(DepositContext)

  return (
    <VerticalLayout alignItems="center" textAlign="center">
      <LumenDepositOptions account={account} onCloseDialog={props.onCloseDialog} />
    </VerticalLayout>
  )
}

const Sidebar = () => (
  <Summary headline="Buy Stellar lumens">
    <Paragraph>We offer options to buy lumens that do not involve a Stellar asset issuer.</Paragraph>
    <Paragraph>
      Stellar lumens (XLM) are the native tokens on the Stellar network. They are used to pay transaction fees, among
      other things.
    </Paragraph>
  </Summary>
)

const PurchaseLumensView = Object.assign(React.memo(PurchaseLumens), { Sidebar })

export default PurchaseLumensView

import React from "react"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../stores/accounts"
import AccountBalances from "./AccountBalances"

const DetailHeading = (props: { children: React.ReactNode; marginTop?: number }) => {
  const { marginTop = 12 } = props
  return (
    <Typography color="inherit" variant="body1" style={{ marginTop, fontSize: "100%", opacity: 0.8 }}>
      {props.children}
    </Typography>
  )
}

const DetailContent = (props: { children: React.ReactNode }) => {
  return (
    <Typography color="inherit" component="div" variant="body1" style={{ fontSize: "120%" }}>
      {props.children}
    </Typography>
  )
}

const AccountDetails = (props: { account: Account }) => {
  const { account } = props
  return (
    <div>
      <DetailHeading marginTop={0}>Balance</DetailHeading>
      <DetailContent>
        <AccountBalances publicKey={account.publicKey} testnet={account.testnet} />
      </DetailContent>
      <DetailHeading>Public Key</DetailHeading>
      <DetailContent>{account.publicKey}</DetailContent>
    </div>
  )
}

export default AccountDetails

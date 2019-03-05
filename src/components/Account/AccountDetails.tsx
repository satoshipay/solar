import React from "react"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import AccountBalances from "./AccountBalances"

const DetailContent = (props: { children: React.ReactNode }) => {
  return (
    <Typography color="inherit" component="div" variant="body2" style={{ marginTop: 8, fontSize: "1.2rem" }}>
      {props.children}
    </Typography>
  )
}

const AccountPublicKey = (props: { publicKey: string }) => {
  const style = {
    display: "inline-block",
    maxWidth: "100%",
    overflow: "hidden",
    fontWeight: 300,
    textOverflow: "ellipsis"
  }
  return <span style={style}>{props.publicKey}</span>
}

const AccountDetails = (props: { account: Account }) => {
  const { account } = props
  return (
    <div>
      <DetailContent>
        <AccountBalances publicKey={account.publicKey} testnet={account.testnet} />
      </DetailContent>
      <DetailContent>
        <AccountPublicKey publicKey={account.publicKey} />
      </DetailContent>
    </div>
  )
}

export default AccountDetails

import React from "react"
import Typography from "@material-ui/core/Typography"
import { DetailData, DetailDataSet } from "../Details"
import { Account } from "../../stores/accounts"
import AccountBalances from "./AccountBalances"

const SecurityStatus = (props: { requiresPassword: boolean; testnet: boolean }) => {
  if (props.requiresPassword) {
    return <>Password-based encryption</>
  } else {
    return props.testnet ? <>No password</> : <Typography color="error">No password</Typography>
  }
}

const AccountDetails = (props: { account: Account }) => {
  const { account } = props
  return (
    <DetailDataSet>
      <DetailData label="Balance" value={<AccountBalances publicKey={account.publicKey} testnet={account.testnet} />} />
      <DetailData label="Public Key" value={account.publicKey} />
      <DetailData
        label="Security"
        value={<SecurityStatus requiresPassword={account.requiresPassword} testnet={account.testnet} />}
      />
      {account.testnet ? <DetailData label="Network" value="Testnet" /> : null}
    </DetailDataSet>
  )
}

export default AccountDetails

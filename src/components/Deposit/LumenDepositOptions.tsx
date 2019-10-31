import React from "react"
import OpenInNewIcon from "@material-ui/icons/OpenInNew"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import { Account } from "../../context/accounts"
import { useRouter } from "../../hooks/userinterface"
import { openLink } from "../../platform/links"

function createMoonPayURLForAccount(account: Account) {
  const baseURL = "https://buy.moonpay.io/"
  const apiKEY = account.testnet ? "pk_test_RPUOOEJ7ZiAWlLFG6lbohDF9d2SqICX" : "pk_live_Xly1jO3hHE46AyMJO50lwoAk2VUCon"
  const currencyCode = "XLM"
  const colorCode = "1c8fea"
  return `${baseURL}?apiKey=${apiKEY}&currencyCode=${currencyCode}&walletAddress=${account.publicKey}&colorCode=%23${colorCode}`
}

interface LumenDepositOptionsProps {
  account: Account
}

function LumenDepositOptions(props: LumenDepositOptionsProps) {
  const { account } = props
  const router = useRouter()

  const navigateToMoonPay = React.useCallback(() => openLink(createMoonPayURLForAccount(account)), [account, router])

  return (
    <List style={{ margin: "16px auto", maxWidth: 600 }}>
      <ListSubheader style={{ background: "none" }}>Funding options</ListSubheader>
      <ListItem button onClick={navigateToMoonPay}>
        <ListItemText
          primary="MoonPay"
          secondary="Buy Stellar Lumens instantly using your debit/credit card or Apple Pay"
        />
        <ListItemIcon style={{ minWidth: 40, marginLeft: 8 }}>
          <OpenInNewIcon />
        </ListItemIcon>
      </ListItem>
    </List>
  )
}

export default React.memo(LumenDepositOptions)

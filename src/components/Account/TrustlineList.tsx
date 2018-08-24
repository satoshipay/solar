import React from "react"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import { AccountName } from "../Fetchers"
import { AccountData } from "../Subscribers"

const TrustlineList = (props: { publicKey: string; testnet: boolean }) => {
  return (
    <AccountData publicKey={props.publicKey} testnet={props.testnet}>
      {accountData => (
        <List>
          <ListSubheader>Trusted Assets</ListSubheader>
          <ListItem>
            <ListItemText primary="XLM" secondary="Stellar Lumens" />
          </ListItem>
          {accountData.balances.filter(balance => balance.asset_type !== "native").map((balance, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={(balance as any).asset_code}
                secondary={<AccountName publicKey={(balance as any).asset_issuer} testnet={props.testnet} />}
              />
            </ListItem>
          ))}
        </List>
      )}
    </AccountData>
  )
}

export default TrustlineList

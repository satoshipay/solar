import React from "react"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import AddIcon from "@material-ui/icons/AddCircle"
import { trustlineLimitEqualsUnlimited } from "../../lib/stellar"
import { AccountName } from "../Fetchers"
import { AccountData } from "../Subscribers"

const Line = (props: { children: React.ReactNode }) => <span style={{ display: "block" }}>{props.children}</span>

interface Props {
  publicKey: string
  testnet: boolean
  onAddTrustline?: () => void
}

const TrustlineList = (props: Props) => {
  return (
    <AccountData publicKey={props.publicKey} testnet={props.testnet}>
      {accountData => (
        <List>
          <ListSubheader>Trusted Assets</ListSubheader>
          <ListItem>
            <ListItemText inset primary="XLM" secondary="Stellar Lumens" />
          </ListItem>
          {accountData.balances.filter(balance => balance.asset_type !== "native").map(
            (balance: any, index) =>
              console.log(">", balance) || (
                <ListItem key={index}>
                  <ListItemText
                    inset
                    primary={balance.asset_code}
                    secondary={
                      <>
                        <Line>
                          <AccountName publicKey={balance.asset_issuer} testnet={props.testnet} />
                        </Line>
                        <Line>{trustlineLimitEqualsUnlimited(balance.limit) ? null : `Limit ${balance.limit}`}</Line>
                      </>
                    }
                  />
                </ListItem>
              )
          )}
          {!props.onAddTrustline ? null : (
            <ListItem button onClick={props.onAddTrustline}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText inset primary="Add Asset" secondary="Click to trust another asset" />
            </ListItem>
          )}
        </List>
      )}
    </AccountData>
  )
}

export default TrustlineList

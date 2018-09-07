import React from "react"
import { Asset } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import ListSubheader from "@material-ui/core/ListSubheader"
import Tooltip from "@material-ui/core/Tooltip"
import AddIcon from "@material-ui/icons/AddCircle"
import RemoveIcon from "@material-ui/icons/RemoveCircle"
import { trustlineLimitEqualsUnlimited } from "../../lib/stellar"
import { AccountName } from "../Fetchers"
import { AccountData } from "../Subscribers"

const Line = (props: { children: React.ReactNode }) => <span style={{ display: "block" }}>{props.children}</span>

interface Props {
  publicKey: string
  testnet: boolean
  onAddTrustline?: () => void
  onRemoveTrustline?: (asset: Asset) => void
}

const TrustlineList = (props: Props) => {
  const { onRemoveTrustline = () => undefined } = props

  return (
    <AccountData publicKey={props.publicKey} testnet={props.testnet}>
      {accountData => (
        <List>
          <ListSubheader>Trusted Assets</ListSubheader>
          <ListItem>
            <ListItemText inset primary="XLM" secondary="Stellar Lumens" />
          </ListItem>
          {accountData.balances.filter(balance => balance.asset_type !== "native").map((balance: any, index) => (
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
              <ListItemSecondaryAction>
                <Tooltip title="Remove asset">
                  <IconButton
                    aria-label="Remove asset"
                    onClick={() => onRemoveTrustline(new Asset(balance.asset_code, balance.asset_issuer))}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
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

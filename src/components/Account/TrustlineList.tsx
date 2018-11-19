import React from "react"
import { AccountRecord, Asset } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import Tooltip from "@material-ui/core/Tooltip"
import AddIcon from "@material-ui/icons/AddCircleOutlined"
import CheckIcon from "@material-ui/icons/CheckCircleOutlined"
import RemoveIcon from "@material-ui/icons/RemoveCircle"
import { Account } from "../../context/accounts"
import { mainnet as mainnetPopularAssets, testnet as testnetPopularAssets } from "../../lib/popularAssets"
import { trustlineLimitEqualsUnlimited } from "../../lib/stellar"
import { AccountName } from "../Fetchers"
import { AccountData } from "../Subscribers"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

const Line = (props: { children: React.ReactNode }) => <span style={{ display: "block" }}>{props.children}</span>

interface Props {
  account: Account
  balances: AccountRecord["balances"]
  onAddAsset: (asset: Asset, options?: { limit?: string }) => Promise<void>
  onRemoveTrustline?: (asset: Asset) => void
}

class TrustlineList extends React.Component<Props> {
  isAssetAlreadyAdded = (asset: Asset) => {
    return this.props.balances.some(
      (balance: any) => balance.asset_code === asset.code && balance.asset_issuer === asset.issuer
    )
  }

  render() {
    const { account, onAddAsset, onRemoveTrustline = () => undefined } = this.props
    const popularAssets = account.testnet ? testnetPopularAssets : mainnetPopularAssets
    const popularAssetsNotYetAdded = popularAssets.filter(asset => !this.isAssetAlreadyAdded(asset))

    return (
      <AccountData publicKey={account.publicKey} testnet={account.testnet}>
        {accountData => (
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckIcon />
              </ListItemIcon>
              <ListItemText inset primary="XLM" secondary="Stellar Lumens" />
            </ListItem>
            {accountData.balances.filter(balance => balance.asset_type !== "native").map((balance: any, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckIcon />
                </ListItemIcon>
                <ListItemText
                  inset
                  primary={balance.asset_code}
                  secondary={
                    <>
                      <Line>
                        <AccountName publicKey={balance.asset_issuer} testnet={account.testnet} />
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
            {popularAssetsNotYetAdded.map(asset => (
              <ListItem
                key={[asset.issuer, asset.code].join("")}
                button
                component="li"
                onClick={() => onAddAsset(asset)}
              >
                <ListItemIcon>
                  <AddIcon />
                </ListItemIcon>
                <ListItemText
                  inset
                  primary={asset.code}
                  secondary={<AccountName publicKey={asset.issuer} testnet={account.testnet} />}
                />
              </ListItem>
            ))}
          </List>
        )}
      </AccountData>
    )
  }
}

const TrustlineListContainer = (props: Omit<Props, "balances">) => {
  return (
    <AccountData publicKey={props.account.publicKey} testnet={props.account.testnet}>
      {accountData => <TrustlineList {...props} balances={accountData.balances} />}
    </AccountData>
  )
}

export default TrustlineListContainer

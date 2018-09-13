import React from "react"
import { AccountRecord, Asset, Operation, Server, Transaction } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import Divider from "@material-ui/core/Divider"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import ListSubheader from "@material-ui/core/ListSubheader"
import Tooltip from "@material-ui/core/Tooltip"
import AddIcon from "@material-ui/icons/AddCircleOutlined"
import CheckIcon from "@material-ui/icons/CheckCircleOutlined"
import RemoveIcon from "@material-ui/icons/RemoveCircle"
import { mainnet as mainnetPopularAssets, testnet as testnetPopularAssets } from "../../lib/popularAssets"
import { trustlineLimitEqualsUnlimited } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import { AccountName } from "../Fetchers"
import { AccountData } from "../Subscribers"
import TransactionSender from "../TransactionSender"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

const Line = (props: { children: React.ReactNode }) => <span style={{ display: "block" }}>{props.children}</span>

interface Props {
  account: Account
  balances: AccountRecord["balances"]
  horizon: Server
  sendTransaction: (transaction: Transaction) => void
  onAddCustomTrustline?: () => void
  onRemoveTrustline?: (asset: Asset) => void
}

class TrustlineList extends React.Component<Props> {
  addAsset = async (asset: Asset, options: { limit?: string } = {}) => {
    try {
      const operations = [Operation.changeTrust({ asset, limit: options.limit })]
      const transaction = await createTransaction(operations, {
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })
      this.props.sendTransaction(transaction)
    } catch (error) {
      addError(error)
    }
  }

  isAssetAlreadyAdded = (asset: Asset) => {
    return this.props.balances.some(
      (balance: any) => balance.asset_code === asset.code && balance.asset_issuer === asset.issuer
    )
  }

  render() {
    const { account, onRemoveTrustline = () => undefined } = this.props
    const popularAssets = account.testnet ? testnetPopularAssets : mainnetPopularAssets
    const popularAssetsNotYetAdded = popularAssets.filter(asset => !this.isAssetAlreadyAdded(asset))

    return (
      <AccountData publicKey={account.publicKey} testnet={account.testnet}>
        {accountData => (
          <List>
            <ListSubheader>Trusted Assets</ListSubheader>
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
                onClick={() => this.addAsset(asset)}
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
            <Divider component="li" style={{ margin: "12px 0" }} />
            <ListItem button component="li" onClick={this.props.onAddCustomTrustline}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText inset primary="Add Custom Asset" secondary="Click to trust another asset" />
            </ListItem>
          </List>
        )}
      </AccountData>
    )
  }
}

const TrustlineListContainer = (props: Omit<Props, "balances" | "horizon" | "sendTransaction">) => {
  return (
    <TransactionSender account={props.account}>
      {({ horizon, sendTransaction }) => (
        <AccountData publicKey={props.account.publicKey} testnet={props.account.testnet}>
          {accountData => (
            <TrustlineList
              {...props}
              balances={accountData.balances}
              horizon={horizon}
              sendTransaction={sendTransaction}
            />
          )}
        </AccountData>
      )}
    </TransactionSender>
  )
}

export default TrustlineListContainer

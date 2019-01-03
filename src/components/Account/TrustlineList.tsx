import React from "react"
import { Asset } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import Tooltip from "@material-ui/core/Tooltip"
import CheckIcon from "@material-ui/icons/CheckCircle"
import RemoveIcon from "@material-ui/icons/Close"
import UncheckedIcon from "@material-ui/icons/RadioButtonUnchecked"
import { Account } from "../../context/accounts"
import { useAccountData } from "../../hooks"
import { mainnet as mainnetPopularAssets, testnet as testnetPopularAssets } from "../../lib/popularAssets"
import { trustlineLimitEqualsUnlimited } from "../../lib/stellar"
import SpaciousList from "../List/SpaciousList"
import { AccountName } from "../Fetchers"
import { SingleBalance } from "./AccountBalances"

const Line = (props: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <span style={{ display: "block", ...props.style }}>{props.children}</span>
)

interface Props {
  account: Account
  onAddAsset: (asset: Asset, options?: { limit?: string }) => Promise<void>
  onRemoveTrustline?: (asset: Asset) => void
}

function TrustlineList(props: Props) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

  const isAssetAlreadyAdded = (asset: Asset) => {
    return accountData.balances.some(
      (balance: any) => balance.asset_code === asset.code && balance.asset_issuer === asset.issuer
    )
  }

  const { account, onAddAsset, onRemoveTrustline = () => undefined } = props
  const popularAssets = account.testnet ? testnetPopularAssets : mainnetPopularAssets
  const popularAssetsNotYetAdded = popularAssets.filter(asset => !isAssetAlreadyAdded(asset))

  const xlmBalance = accountData.balances.find(balance => balance.asset_type === "native")

  return (
    <SpaciousList fitHorizontal>
      <ListItem>
        <ListItemIcon style={{ color: "inherit" }}>
          <CheckIcon />
        </ListItemIcon>
        <ListItemText inset primary="XLM" secondary="Stellar Lumens" />
        <ListItemText primaryTypographyProps={{ align: "right" }} style={{ flexShrink: 0 }}>
          <SingleBalance
            assetCode=""
            balance={xlmBalance ? xlmBalance.balance : "0.00"}
            style={{ fontSize: "1.6rem" }}
          />
        </ListItemText>
        <ListItemSecondaryAction />
      </ListItem>
      {accountData.balances.filter(balance => balance.asset_type !== "native").map((balance: any, index) => (
        <ListItem key={index}>
          <ListItemIcon style={{ color: "inherit" }}>
            <CheckIcon />
          </ListItemIcon>
          <ListItemText
            inset
            primary={balance.asset_code}
            secondary={
              <>
                <Line style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  <AccountName publicKey={balance.asset_issuer} testnet={account.testnet} />
                </Line>
                <Line>{trustlineLimitEqualsUnlimited(balance.limit) ? null : `Limit ${balance.limit}`}</Line>
              </>
            }
          />
          <ListItemText primaryTypographyProps={{ align: "right" }} style={{ flexShrink: 0 }}>
            <SingleBalance assetCode="" balance={balance.balance} style={{ fontSize: "1.6rem" }} />
          </ListItemText>
          <ListItemSecondaryAction>
            <Tooltip title="Remove asset">
              <IconButton
                aria-label="Remove asset"
                disabled={parseFloat(balance.balance) > 0}
                onClick={() => onRemoveTrustline(new Asset(balance.asset_code, balance.asset_issuer))}
                style={{ color: "black" }}
              >
                <RemoveIcon style={{ opacity: parseFloat(balance.balance) > 0 ? 0.5 : 1 }} />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
      {popularAssetsNotYetAdded.map(asset => (
        <ListItem key={[asset.issuer, asset.code].join("")} button component="li" onClick={() => onAddAsset(asset)}>
          <ListItemIcon style={{ color: "inherit" }}>
            <UncheckedIcon />
          </ListItemIcon>
          <ListItemText
            inset
            primary={asset.code}
            secondary={<AccountName publicKey={asset.issuer} testnet={account.testnet} />}
          />
          <ListItemText primaryTypographyProps={{ align: "right" }}>
            <Button
              disabled
              style={{
                borderColor: "rgba(0, 0, 0, 0.87)",
                color: "rgba(0, 0, 0, 0.87)",
                fontWeight: "bold",
                textTransform: "none"
              }}
              variant="outlined"
            >
              Trust Asset
            </Button>
          </ListItemText>
          <ListItemSecondaryAction />
        </ListItem>
      ))}
    </SpaciousList>
  )
}

export default TrustlineList

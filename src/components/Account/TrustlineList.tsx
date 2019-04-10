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
import { useAccountData, useIsMobile, useIsSmallMobile } from "../../hooks"
import { mainnet as mainnetPopularAssets, testnet as testnetPopularAssets } from "../../lib/popularAssets"
import { trustlineLimitEqualsUnlimited } from "../../lib/stellar"
import SpaciousList from "../List/SpaciousList"
import { AccountName } from "../Fetchers"
import { SingleBalance } from "./AccountBalances"

interface CustomAssetBalance {
  asset_type: "credit_alphanum4" | "credit_alphanum12"
  asset_code: string
  asset_issuer: string
  balance: string
  limit: string
}

const Line = (props: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <span style={{ display: "block", ...props.style }}>{props.children}</span>
)

const SecondaryTrustInfo = (props: { balance: CustomAssetBalance; testnet: boolean }) => (
  <>
    <Line style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
      <AccountName publicKey={props.balance.asset_issuer} testnet={props.testnet} />
    </Line>
    <Line>{trustlineLimitEqualsUnlimited(props.balance.limit) ? null : `Limit ${props.balance.limit}`}</Line>
  </>
)

interface TrustedAssetProps {
  account: Account
  balance: CustomAssetBalance
  hoverActions?: React.ReactNode
  onRemoveTrustline: (asset: Asset) => void
}

function TrustedAsset(props: TrustedAssetProps) {
  const { account, balance } = props
  const [hovering, setHovering] = React.useState(false)
  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()

  return (
    <ListItem onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <ListItemIcon style={{ color: "inherit" }}>
        <CheckIcon />
      </ListItemIcon>
      <ListItemText
        inset
        primary={balance.asset_code}
        secondary={<SecondaryTrustInfo balance={balance} testnet={account.testnet} />}
      />
      <ListItemText primaryTypographyProps={{ align: "right" }} style={{ flexShrink: 0 }}>
        {hovering && props.hoverActions ? (
          props.hoverActions
        ) : (
          <SingleBalance
            assetCode=""
            balance={balance.balance}
            style={
              isTinyScreen ? { fontSize: "0.9rem" } : isSmallScreen ? { fontSize: "1.1rem" } : { fontSize: "1.6rem" }
            }
          />
        )}
      </ListItemText>
      <ListItemSecondaryAction>
        <Tooltip title="Remove asset">
          <IconButton
            aria-label="Remove asset"
            disabled={Number.parseFloat(balance.balance) > 0}
            onClick={() => props.onRemoveTrustline(new Asset(balance.asset_code, balance.asset_issuer))}
            style={{ color: "black" }}
          >
            <RemoveIcon style={{ opacity: Number.parseFloat(balance.balance) > 0 ? 0.5 : 1 }} />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  )
}

interface UntrustedAssetProps {
  account: Account
  asset: Asset
  onAddTrustline: (asset: Asset, options?: { limit?: string }) => Promise<void>
}

function UntrustedAsset(props: UntrustedAssetProps) {
  const { account, asset } = props
  return (
    <ListItem button component="li" onClick={() => props.onAddTrustline(asset)}>
      <ListItemIcon style={{ color: "inherit" }}>
        <UncheckedIcon />
      </ListItemIcon>
      <ListItemText
        inset
        primary={asset.code}
        secondaryTypographyProps={{
          style: { overflow: "hidden", textOverflow: "ellipsis" }
        }}
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
  )
}

interface Props {
  account: Account
  onAddTrustline: (asset: Asset, options?: { limit?: string }) => Promise<void>
  onRemoveTrustline: (asset: Asset) => void
}

function TrustlineList(props: Props) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()

  const isAssetAlreadyAdded = (asset: Asset) => {
    return accountData.balances.some(
      (balance: any) => balance.asset_code === asset.code && balance.asset_issuer === asset.issuer
    )
  }

  const { account, onAddTrustline, onRemoveTrustline = () => undefined } = props
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
            style={
              isTinyScreen ? { fontSize: "0.9rem" } : isSmallScreen ? { fontSize: "1.1rem" } : { fontSize: "1.6rem" }
            }
          />
        </ListItemText>
        <ListItemSecondaryAction />
      </ListItem>
      {accountData.balances.filter(balance => balance.asset_type !== "native").map((balance: any, index) => (
        <TrustedAsset key={index} account={account} balance={balance} onRemoveTrustline={onRemoveTrustline} />
      ))}
      {popularAssetsNotYetAdded.map(asset => (
        <UntrustedAsset
          key={[asset.issuer, asset.code].join("")}
          account={account}
          asset={asset}
          onAddTrustline={onAddTrustline}
        />
      ))}
    </SpaciousList>
  )
}

export default TrustlineList

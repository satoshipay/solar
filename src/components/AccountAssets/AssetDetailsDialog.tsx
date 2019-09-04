import React from "react"
import { Asset } from "stellar-sdk"
import Avatar from "@material-ui/core/Avatar"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import { Account } from "../../context/accounts"
import {
  useAccountData,
  useAccountOffers,
  useAssetMetadata,
  useClipboard,
  useIsMobile,
  useStellarToml
} from "../../hooks"
import { parseAssetID } from "../../lib/stellar"
import { openLink } from "../../platform/links"
import { breakpoints } from "../../theme"
import { StellarTomlCurrency } from "../../types/stellar-toml"
import DialogBody from "../Dialog/DialogBody"
import { AccountName } from "../Fetchers"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { VerticalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"
import AssetDetailsActions from "./AssetDetailsActions"
import AssetLogo from "./AssetLogo"
import SpendableBalanceBreakdown from "./SpendableBalanceBreakdown"

const capitalize = (text: string) => text[0].toUpperCase() + text.substr(1)

const useDetailContentStyles = makeStyles(theme => ({
  card: {
    backgroundColor: "#fbfbfb",
    borderRadius: 8,
    margin: "12px -8px",
    overflowY: "auto"
  },
  cardContent: {
    position: "relative",
    padding: "8px 16px !important"
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 400,
    marginBottom: 8
  },
  cardLogo: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 72,
    height: 72,
    backgroundColor: "white",
    boxShadow: "0 0 2px 2px rgba(0, 0, 0, 0.2)"
  },
  cardLogoImage: {
    width: "100%",
    height: "100%"
  }
}))

interface LumenDetailProps {
  account: Account
}

// tslint:disable-next-line no-shadowed-variable
const LumenDetails = React.memo(function LumenDetails(props: LumenDetailProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const classes = useDetailContentStyles()

  return (
    <>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <ReadOnlyTextfield
            disableUnderline
            fullWidth
            label="Description"
            multiline
            value={
              "The native token of the Stellar network.\n\n" +
              "Every account on the network has a lumens balance. Lumens are used to pay transaction fees."
            }
          />
        </CardContent>
      </Card>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography className={classes.cardTitle} variant="h6">
            Balance breakdown
          </Typography>
          <SpendableBalanceBreakdown account={props.account} accountData={accountData} baseReserve={0.5} />
        </CardContent>
      </Card>
    </>
  )
})

interface AssetDetailProps {
  account: Account
  asset: Asset
  metadata: StellarTomlCurrency | undefined
}

// tslint:disable-next-line no-shadowed-variable
const AssetDetails = React.memo(function AssetDetails({ account, asset, metadata }: AssetDetailProps) {
  const accountData = useAccountData(account.publicKey, account.testnet)
  const accountOffers = useAccountOffers(account.publicKey, account.testnet)
  const issuingAccountData = useAccountData(asset.issuer, account.testnet)
  const [stellarToml] = useStellarToml(issuingAccountData.home_domain)

  const balance = accountData.balances.find(
    bal => bal.asset_type !== "native" && bal.asset_issuer === asset.issuer && bal.asset_code === asset.code
  )
  const openBuyOffers = accountOffers.offers.filter(
    offer =>
      offer.buying.asset_type !== "native" &&
      offer.buying.asset_issuer === asset.issuer &&
      offer.buying.asset_code === asset.code
  )
  const openSellOffers = accountOffers.offers.filter(
    offer =>
      offer.selling.asset_type !== "native" &&
      offer.selling.asset_issuer === asset.issuer &&
      offer.selling.asset_code === asset.code
  )

  const clipboard = useClipboard()
  const classes = useDetailContentStyles()

  const copyIssuerToClipboard = React.useCallback(() => clipboard.copyToClipboard(asset.getIssuer()), [
    asset.getIssuer(),
    clipboard.copyToClipboard
  ])

  return (
    <>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          {metadata && metadata.desc ? (
            <ReadOnlyTextfield
              disableUnderline
              fullWidth
              label="Description"
              margin="dense"
              multiline
              value={metadata.desc}
            />
          ) : null}
          <ReadOnlyTextfield
            disableUnderline
            fullWidth
            label="Issuing account"
            margin="dense"
            value={asset.getIssuer()}
            inputProps={{
              onClick: copyIssuerToClipboard,
              style: {
                cursor: "pointer",
                textOverflow: "ellipsis"
              }
            }}
          />
          <ReadOnlyTextfield
            disableUnderline
            fullWidth
            label="Account flags"
            margin="dense"
            multiline
            value={capitalize(
              [
                issuingAccountData.flags.auth_required ? "auth required" : "no auth required",
                issuingAccountData.flags.auth_revocable ? "auth revocable" : "auth irrevocable",
                issuingAccountData.flags.auth_immutable ? "immutable flags" : "mutable flags"
              ].join(", ")
            )}
          />
          {metadata && metadata.conditions ? (
            <ReadOnlyTextfield
              disableUnderline
              fullWidth
              label="Conditions"
              margin="dense"
              multiline
              value={metadata.conditions}
            />
          ) : null}
          {metadata && metadata.anchor_asset_type ? (
            <ReadOnlyTextfield
              disableUnderline
              fullWidth
              label="Anchored to"
              margin="dense"
              multiline
              value={
                metadata.anchor_asset
                  ? `${capitalize(metadata.anchor_asset)} (${capitalize(metadata.anchor_asset_type)})`
                  : capitalize(metadata.anchor_asset_type)
              }
            />
          ) : null}
          {metadata && metadata.redemption_instructions ? (
            <ReadOnlyTextfield
              disableUnderline
              fullWidth
              label="Redemption instructions"
              margin="dense"
              multiline
              value={metadata.redemption_instructions}
            />
          ) : null}
        </CardContent>
      </Card>
      {stellarToml && stellarToml.DOCUMENTATION ? (
        <Card className={classes.card}>
          <CardContent className={classes.cardContent}>
            <Typography className={classes.cardTitle} variant="h6">
              Issuer information
            </Typography>
            {stellarToml.DOCUMENTATION.ORG_LOGO ? (
              <Avatar className={classes.cardLogo}>
                <img
                  alt="Organization logo"
                  className={classes.cardLogoImage}
                  src={stellarToml.DOCUMENTATION.ORG_LOGO}
                />
              </Avatar>
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_NAME ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label="Organization name"
                margin="dense"
                value={stellarToml.DOCUMENTATION.ORG_NAME}
              />
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_DBA ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label="Doing business as"
                margin="dense"
                value={stellarToml.DOCUMENTATION.ORG_DBA}
              />
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_URL ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label="Website"
                margin="dense"
                value={stellarToml.DOCUMENTATION.ORG_URL}
                inputProps={{
                  onClick: () => openLink(stellarToml!.DOCUMENTATION!.ORG_URL!),
                  style: {
                    cursor: "pointer",
                    textDecoration: "underline"
                  }
                }}
              />
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_DESCRIPTION ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label="Doing business as"
                margin="dense"
                multiline
                value={stellarToml.DOCUMENTATION.ORG_DESCRIPTION}
              />
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_PHYSICAL_ADDRESS ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label="Address"
                margin="dense"
                multiline
                value={stellarToml.DOCUMENTATION.ORG_PHYSICAL_ADDRESS}
                inputProps={{
                  style: {
                    whiteSpace: "pre"
                  }
                }}
              />
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_OFFICIAL_EMAIL ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label="Email address"
                margin="dense"
                multiline
                value={stellarToml.DOCUMENTATION.ORG_OFFICIAL_EMAIL}
                inputProps={{
                  onClick: () => openLink("mailto:" + stellarToml!.DOCUMENTATION!.ORG_OFFICIAL_EMAIL!),
                  style: {
                    cursor: "pointer",
                    textDecoration: "underline"
                  }
                }}
              />
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_PHONE_NUMBER ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label="Phone number"
                margin="dense"
                multiline
                value={stellarToml.DOCUMENTATION.ORG_PHONE_NUMBER}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {balance ? (
        <Card className={classes.card}>
          <CardContent className={classes.cardContent}>
            <Typography className={classes.cardTitle} variant="h6">
              My Account
            </Typography>
            <ReadOnlyTextfield
              disableUnderline
              fullWidth
              label="Current balance"
              margin="dense"
              value={`${balance.balance} ${asset.code}`}
            />
            <ReadOnlyTextfield
              disableUnderline
              fullWidth
              label="Open trade offers"
              margin="dense"
              value={openBuyOffers.length + openSellOffers.length || "–"}
            />
          </CardContent>
        </Card>
      ) : null}
    </>
  )
})

const useAssetDetailStyles = makeStyles({
  logo: {
    position: "absolute",
    top: 4,
    right: -4,
    width: 96,
    height: 96,
    boxShadow: "0 0 8px 2px rgba(0, 0, 0, 0.2)",
    fontSize: 24,

    [breakpoints.down(600)]: {
      width: 64,
      height: 64,
      fontSize: 18
    }
  },
  domain: {
    marginTop: -4,
    marginLeft: 44,
    marginBottom: 16,

    [breakpoints.down(600)]: {
      marginLeft: 36
    }
  }
})

interface Props {
  account: Account
  assetID: string
  onClose: () => void
}

function AssetDetailsDialog(props: Props) {
  const asset = React.useMemo(() => parseAssetID(props.assetID), [props.assetID])
  const classes = useAssetDetailStyles()
  const isSmallScreen = useIsMobile()

  const metadataMap = useAssetMetadata([asset], props.account.testnet)
  const [metadata] = metadataMap.get(asset) || [undefined, false]

  const dialogActions = React.useMemo(
    () => (asset.isNative() ? null : <AssetDetailsActions account={props.account} asset={asset} />),
    [props.account, asset]
  )

  return (
    <DialogBody
      excessWidth={8}
      top={
        <>
          <MainTitle
            nowrap
            onBack={props.onClose}
            style={{ position: "relative", zIndex: 1 }}
            title={
              asset.isNative()
                ? "Stellar Lumens (XLM)"
                : metadata && metadata.name
                  ? `${metadata.name} (${asset.getCode()})`
                  : asset.getCode()
            }
            titleStyle={{
              maxWidth: "calc(100% - 100px)",
              textShadow: "0 0 5px white, 0 0 5px white, 0 0 5px white"
            }}
          />
          <Typography className={classes.domain} variant="subtitle1">
            {asset.isNative() ? (
              "stellar.org"
            ) : (
              <AccountName publicKey={asset.getIssuer()} testnet={props.account.testnet} />
            )}
          </Typography>
          <AssetLogo asset={asset} className={classes.logo} imageURL={metadata && metadata.image} />
        </>
      }
      actions={dialogActions}
      actionsPosition="bottom"
      fitToShrink
    >
      <VerticalLayout margin="16px 4px 0" padding={`0 0 ${isSmallScreen ? 64 : 0}px`} shrink={0}>
        {asset.isNative() ? (
          <LumenDetails account={props.account} />
        ) : (
          <AssetDetails account={props.account} asset={asset} metadata={metadata} />
        )}
      </VerticalLayout>
    </DialogBody>
  )
}

export default AssetDetailsDialog

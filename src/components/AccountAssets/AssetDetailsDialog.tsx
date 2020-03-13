import React from "react"
import { useTranslation } from "react-i18next"
import { Asset } from "stellar-sdk"
import Avatar from "@material-ui/core/Avatar"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import { Account } from "../../context/accounts"
import { useAccountData, useAssetMetadata, useStellarToml } from "../../hooks/stellar"
import { useClipboard, useIsMobile } from "../../hooks/userinterface"
import { parseAssetID } from "../../lib/stellar"
import { openLink } from "../../platform/links"
import { breakpoints } from "../../theme"
import { StellarTomlCurrency } from "../../types/stellar-toml"
import { SingleBalance } from "../Account/AccountBalances"
import DialogBody from "../Dialog/DialogBody"
import { AccountName } from "../Fetchers"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { VerticalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"
import AssetDetailsActions from "./AssetDetailsActions"
import AssetLogo from "./AssetLogo"
import SpendableBalanceBreakdown from "./SpendableBalanceBreakdown"

const capitalize = (text: string) => text[0].toUpperCase() + text.substr(1)

const useDetailContentStyles = makeStyles({
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
})

interface LumenDetailProps {
  account: Account
}

const LumenDetails = React.memo(function LumenDetails(props: LumenDetailProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const classes = useDetailContentStyles()
  const { t } = useTranslation()

  return (
    <>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <ReadOnlyTextfield
            disableUnderline
            fullWidth
            label={t("asset-details.lumen.description.label")}
            multiline
            value={t("asset-details.lumen.description.text")}
          />
        </CardContent>
      </Card>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
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

const AssetDetails = React.memo(function AssetDetails({ account, asset, metadata }: AssetDetailProps) {
  const issuingAccountData = useAccountData(asset.issuer, account.testnet)
  const stellarToml = useStellarToml(issuingAccountData.home_domain)

  const classes = useDetailContentStyles()
  const clipboard = useClipboard()
  const { t } = useTranslation()

  const copyIssuerToClipboard = React.useCallback(() => clipboard.copyToClipboard(asset.getIssuer()), [
    asset,
    clipboard
  ])

  return (
    <>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          {metadata && metadata.desc ? (
            <ReadOnlyTextfield
              disableUnderline
              fullWidth
              label={t("asset-details.general.description.label")}
              margin="dense"
              multiline
              value={metadata.desc}
            />
          ) : null}
          <ReadOnlyTextfield
            disableUnderline
            fullWidth
            label={t("asset-details.general.issuing-account.label")}
            margin="dense"
            onClick={copyIssuerToClipboard}
            value={asset.getIssuer()}
            inputProps={{
              style: {
                cursor: "pointer",
                textOverflow: "ellipsis"
              }
            }}
          />
          <ReadOnlyTextfield
            disableUnderline
            fullWidth
            label={t("asset-details.general.account-flags.label")}
            margin="dense"
            multiline
            value={capitalize(
              [
                issuingAccountData.flags.auth_required
                  ? `• ${t("asset-details.general.account-flags.auth-required")}`
                  : `• ${t("asset-details.general.account-flags.auth-not-required")}`,
                issuingAccountData.flags.auth_revocable
                  ? `• ${t("asset-details.general.account-flags.auth-revocable")}`
                  : `• ${t("asset-details.general.account-flags.auth-not-revocable")}`,
                issuingAccountData.flags.auth_immutable
                  ? `• ${t("asset-details.general.account-flags.auth-immutable")}`
                  : `• ${t("asset-details.general.account-flags.auth-mutable")}`
              ].join("\n")
            )}
          />
          {metadata && metadata.conditions ? (
            <ReadOnlyTextfield
              disableUnderline
              fullWidth
              label={t("asset-details.general.conditions.label")}
              margin="dense"
              multiline
              value={metadata.conditions}
            />
          ) : null}
          {metadata && metadata.anchor_asset_type ? (
            <ReadOnlyTextfield
              disableUnderline
              fullWidth
              label={t("asset-details.general.anchor-asset.label")}
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
              label={t("asset-details.general.redemption-instructions")}
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
                label={t("asset-details.general.organisation.name.label")}
                margin="dense"
                value={stellarToml.DOCUMENTATION.ORG_NAME}
              />
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_DBA ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label={t("asset-details.general.organisation.dba.label")}
                margin="dense"
                value={stellarToml.DOCUMENTATION.ORG_DBA}
              />
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_URL ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label={t("asset-details.general.organisation.website.label")}
                margin="dense"
                onClick={() => openLink(stellarToml!.DOCUMENTATION!.ORG_URL!)}
                value={stellarToml.DOCUMENTATION.ORG_URL}
                inputProps={{
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
                label={t("asset-details.general.organisation.description.label")}
                margin="dense"
                multiline
                value={stellarToml.DOCUMENTATION.ORG_DESCRIPTION}
              />
            ) : null}
            {stellarToml.DOCUMENTATION.ORG_PHYSICAL_ADDRESS ? (
              <ReadOnlyTextfield
                disableUnderline
                fullWidth
                label={t("asset-details.general.organisation.address.label")}
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
                label={t("asset-details.general.organisation.email.label")}
                margin="dense"
                multiline
                onClick={() => openLink("mailto:" + stellarToml!.DOCUMENTATION!.ORG_OFFICIAL_EMAIL!)}
                value={stellarToml.DOCUMENTATION.ORG_OFFICIAL_EMAIL}
                inputProps={{
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
                label={t("asset-details.general.organisation.phone-number.label")}
                margin="dense"
                multiline
                value={stellarToml.DOCUMENTATION.ORG_PHONE_NUMBER}
              />
            ) : null}
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
    marginLeft: 47, // should be 46, but somehow 47 looks correct
    marginBottom: 16,

    [breakpoints.down(600)]: {
      marginLeft: 39
    }
  }
})

interface Props {
  account: Account
  assetID: string
  onClose: () => void
}

function AssetDetailsDialog(props: Props) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const asset = React.useMemo(() => parseAssetID(props.assetID), [props.assetID])
  const classes = useAssetDetailStyles()
  const isSmallScreen = useIsMobile()

  const balance = accountData.balances.find(
    asset.isNative()
      ? bal => bal.asset_type === "native"
      : bal => bal.asset_type !== "native" && bal.asset_issuer === asset.issuer && bal.asset_code === asset.code
  )

  const metadata = useAssetMetadata(asset, props.account.testnet)

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
              maxWidth: isSmallScreen ? "calc(100% - 75px)" : "calc(100% - 100px)",
              textShadow: "0 0 5px white, 0 0 5px white, 0 0 5px white"
            }}
          />
          <Typography className={classes.domain} variant="subtitle1">
            {balance ? (
              <SingleBalance assetCode={asset.getCode()} balance={balance.balance} />
            ) : asset.isNative() ? (
              "stellar.org"
            ) : (
              <AccountName publicKey={asset.getIssuer()} testnet={props.account.testnet} />
            )}
          </Typography>
          <AssetLogo asset={asset} className={classes.logo} testnet={props.account.testnet} />
        </>
      }
      actions={dialogActions}
      actionsPosition="bottom"
      fitToShrink
    >
      <VerticalLayout margin="0 4px" padding={`0 0 ${isSmallScreen ? 68 : 0}px`} shrink={0}>
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

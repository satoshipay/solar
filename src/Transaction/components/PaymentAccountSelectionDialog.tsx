import React from "react"
import { Trans, useTranslation } from "react-i18next"
import { Asset } from "stellar-sdk"
import { PayStellarUri } from "@stellarguard/stellar-uri"
import Box from "@material-ui/core/Box"
import Grid from "@material-ui/core/Grid"
import makeStyles from "@material-ui/core/styles/makeStyles"
import Typography from "@material-ui/core/Typography"
import CancelIcon from "@material-ui/icons/Cancel"
import SelectIcon from "@material-ui/icons/Check"
import WarningIcon from "@material-ui/icons/Warning"
import { Account, AccountsContext } from "~App/contexts/accounts"
import * as routes from "~App/routes"
import { warningColor } from "~App/theme"
import AccountSelectionList from "~Account/components/AccountSelectionList"
import AssetLogo from "~Assets/components/AssetLogo"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { CopyableAddress } from "~Generic/components/PublicKey"
import MainTitle from "~Generic/components/MainTitle"
import { stringifyAsset } from "~Generic/lib/stellar"
import { useIsMobile, useRouter } from "~Generic/hooks/userinterface"
import DialogBody from "~Layout/components/DialogBody"

const useStyles = makeStyles(theme => ({
  assetContainer: {
    alignSelf: "center",
    display: "flex",
    margin: "0px 8px"
  },
  assetLogo: {
    width: 28,
    height: 28,
    margin: "0px 4px"
  },
  root: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 0 0"
  },
  keyTypography: {
    alignSelf: "center",
    textAlign: "right"
  },
  valueTypography: {
    textAlign: "left"
  },
  uriContainer: {
    paddingTop: 16,
    paddingBottom: 16
  },
  warningContainer: {
    alignItems: "center",
    alignSelf: "center",
    background: warningColor,
    display: "flex",
    justifyContent: "center",
    padding: "6px 16px",
    marginBottom: 16,
    width: "fit-content"
  }
}))

interface PaymentAccountSelectionDialogProps {
  payStellarUri: PayStellarUri
  onClose: () => void
}

function PaymentAccountSelectionDialog(props: PaymentAccountSelectionDialogProps) {
  const { onClose } = props
  const {
    amount,
    assetCode,
    assetIssuer,
    destination,
    memo,
    memoType,
    msg,
    originDomain,
    signature,
    isTestNetwork: testnet
  } = props.payStellarUri

  const classes = useStyles()
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const { t } = useTranslation()

  const { accounts } = React.useContext(AccountsContext)
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)

  const asset = React.useMemo(() => (assetCode && assetIssuer ? new Asset(assetCode, assetIssuer) : Asset.native()), [
    assetCode,
    assetIssuer
  ])
  const keyItemXS = React.useMemo(() => (isSmallScreen ? 4 : 5), [isSmallScreen])
  const selectableAccounts = React.useMemo(() => accounts.filter(acc => acc.testnet === testnet), [accounts, testnet])

  const onSelect = React.useCallback(() => {
    if (!selectedAccount) return

    const params = new URLSearchParams()
    if (amount) params.append("amount", amount)
    if (asset) params.append("asset", stringifyAsset(asset))
    if (destination) params.append("destination", destination)
    if (memo) params.append("memo", memo)
    if (memoType) params.append("memoType", memoType)

    onClose()
    router.history.push(routes.createPayment(selectedAccount.id) + "?" + params.toString())
  }, [amount, asset, destination, memo, memoType, router.history, selectedAccount, onClose])

  return (
    <DialogBody
      noMaxWidth
      preventNotchSpacing
      top={
        <MainTitle hideBackButton onBack={onClose} title={t("transaction-request.payment-account-selection.title")} />
      }
      actions={
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<CancelIcon />} onClick={onClose} type="secondary">
            {t("transaction-request.payment-account-selection.action.dismiss")}
          </ActionButton>
          <ActionButton disabled={!selectedAccount} icon={<SelectIcon />} onClick={onSelect} type="primary">
            {t("transaction-request.payment-account-selection.action.select")}
          </ActionButton>
        </DialogActionsBox>
      }
    >
      <Box className={classes.root}>
        {!signature && (
          <Box className={classes.warningContainer}>
            <WarningIcon />
            <Typography style={{ padding: 8 }}>{t("transaction-request.payment-account-selection.warning")}</Typography>
            <WarningIcon />
          </Box>
        )}
        <Typography variant="body1" color="textSecondary">
          {originDomain ? (
            <Trans i18nKey="transaction-request.payment-account-selection.header.origin-domain">
              You opened the following payment request from <b>{{ originDomain }}</b>:
            </Trans>
          ) : (
            t("transaction-request.payment-account-selection.header.no-origin-domain")
          )}
        </Typography>
        <Typography className={classes.uriContainer} variant="h6">
          <Grid container spacing={3}>
            <Grid className={classes.keyTypography} item xs={keyItemXS}>
              {t("transaction-request.payment-account-selection.uri-content.pay")}
            </Grid>
            <Grid item xs style={{ display: "flex" }}>
              {amount ? amount : t("transaction-request.payment-account-selection.uri-content.any")}
              <div className={classes.assetContainer}>
                {asset.getCode()}
                <AssetLogo asset={asset} className={classes.assetLogo} testnet={testnet} />
              </div>
            </Grid>
          </Grid>
          <Grid container spacing={3} wrap="nowrap">
            <Grid className={classes.keyTypography} item xs={keyItemXS}>
              {t("transaction-request.payment-account-selection.uri-content.to")}
            </Grid>
            <Grid item xs zeroMinWidth>
              <CopyableAddress address={destination} testnet={testnet} variant="short" />
            </Grid>
          </Grid>
          {memo && (
            <Grid container spacing={3}>
              <Grid className={classes.keyTypography} item xs={keyItemXS}>
                {t("transaction-request.payment-account-selection.uri-content.memo")}
              </Grid>
              <Grid item xs>
                {memo}
              </Grid>
            </Grid>
          )}
          {msg && (
            <Grid container spacing={3}>
              <Grid className={classes.keyTypography} item xs={keyItemXS}>
                {t("transaction-request.payment-account-selection.uri-content.message")}
              </Grid>
              <Grid item xs>
                {msg}
              </Grid>
            </Grid>
          )}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {t("transaction-request.payment-account-selection.footer")}
        </Typography>
        <AccountSelectionList accounts={selectableAccounts} onChange={setSelectedAccount} testnet={testnet} />
      </Box>
    </DialogBody>
  )
}

export default PaymentAccountSelectionDialog

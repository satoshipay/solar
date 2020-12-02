import React from "react"
import { Trans, useTranslation } from "react-i18next"
import { Asset } from "stellar-sdk"
import { PayStellarUri } from "@stellarguard/stellar-uri"
import Box from "@material-ui/core/Box"
import Dialog from "@material-ui/core/Dialog"
import Grid from "@material-ui/core/Grid"
import makeStyles from "@material-ui/core/styles/makeStyles"
import Typography from "@material-ui/core/Typography"
import CancelIcon from "@material-ui/icons/Cancel"
import SelectIcon from "@material-ui/icons/Check"
import WarningIcon from "@material-ui/icons/Warning"
import { Account, AccountsContext } from "~App/contexts/accounts"
import { FullscreenDialogTransition, warningColor } from "~App/theme"
import AccountSelectionList from "~Account/components/AccountSelectionList"
import AssetLogo from "~Assets/components/AssetLogo"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { CopyableAddress } from "~Generic/components/PublicKey"
import MainTitle from "~Generic/components/MainTitle"
import ViewLoading from "~Generic/components/ViewLoading"
import { balancelineToAsset } from "~Generic/lib/stellar"
import { useLiveAccountDataSet } from "~Generic/hooks/stellar-subscriptions"
import { useIsMobile } from "~Generic/hooks/userinterface"
import DialogBody from "~Layout/components/DialogBody"
import PaymentDialog from "~Payment/components/PaymentDialog"

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
  const { t } = useTranslation()

  const { accounts } = React.useContext(AccountsContext)
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = React.useState(false)

  const asset = React.useMemo(() => (assetCode && assetIssuer ? new Asset(assetCode, assetIssuer) : Asset.native()), [
    assetCode,
    assetIssuer
  ])
  const keyItemXS = React.useMemo(() => (isSmallScreen ? 4 : 5), [isSmallScreen])

  const accountDataSet = useLiveAccountDataSet(
    accounts.map(acc => acc.publicKey),
    testnet
  )

  const selectableAccounts = React.useMemo(
    () =>
      accounts.filter(acc => {
        if (acc.testnet !== testnet) return false
        const matchingAccountData = accountDataSet.find(accData => accData.account_id === acc.publicKey)
        if (!matchingAccountData) return false
        const trustlines = matchingAccountData.balances.map(balancelineToAsset)
        // only show accounts that have trustline for specified asset
        return Boolean(trustlines.find(trustline => trustline.code === asset.code && trustline.issuer === asset.issuer))
      }),
    [accountDataSet, accounts, asset, testnet]
  )

  const paymentParams = React.useMemo(() => {
    return {
      amount,
      asset,
      destination,
      memo,
      memoType
    }
  }, [amount, asset, destination, memo, memoType])

  const onSelect = React.useCallback(() => {
    if (selectedAccount) {
      setShowPaymentDialog(true)
    }
  }, [selectedAccount])

  return (
    <>
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
              <Typography style={{ padding: 8 }}>
                {t("transaction-request.payment-account-selection.warning")}
              </Typography>
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
          {selectableAccounts.length > 0 ? (
            <AccountSelectionList accounts={selectableAccounts} onChange={setSelectedAccount} testnet={testnet} />
          ) : (
            <Typography align="center" color="error" variant="h6" style={{ paddingTop: 16 }}>
              {asset.code === "XLM"
                ? t("transaction-request.payment-account-selection.error.no-activated-accounts")
                : t("transaction-request.payment-account-selection.error.no-accounts-with-trustline")}
            </Typography>
          )}
        </Box>
      </DialogBody>
      {selectedAccount && (
        <Dialog
          open={showPaymentDialog}
          fullScreen
          onClose={() => setShowPaymentDialog(false)}
          TransitionComponent={FullscreenDialogTransition}
        >
          <React.Suspense fallback={<ViewLoading />}>
            <PaymentDialog
              account={selectedAccount}
              onClose={() => setShowPaymentDialog(false)}
              onSubmissionCompleted={props.onClose}
              paymentParams={paymentParams}
            />
          </React.Suspense>
        </Dialog>
      )}
    </>
  )
}

export default PaymentAccountSelectionDialog

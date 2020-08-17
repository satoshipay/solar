import React from "react"
import { useTranslation, Trans } from "react-i18next"
import CircularProgress from "@material-ui/core/CircularProgress"
import Dialog from "@material-ui/core/Dialog"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core"
import { Account, AccountsContext } from "~App/contexts/accounts"
import { DialogActionsBox, ActionButton } from "~Generic/components/DialogActions"
import { useHorizonURL } from "~Generic/hooks/stellar"
import { useIsMobile } from "~Generic/hooks/userinterface"
import { useNetWorker } from "~Generic/hooks/workers"
import { requestHardwareAccounts, getConnectedWallets } from "~Platform/hardware-wallet"
import { subscribeToMessages } from "~Platform/ipc"
import { openLink } from "~Platform/links"
import { Messages } from "~shared/ipc"

const useStyles = makeStyles(() => ({
  typography: {
    marginTop: 8,
    marginBottom: 8
  },
  typographyContainer: {
    display: "flex",
    alignItems: "center"
  }
}))

interface BluetoothOnboardingDialogProps {
  showBluetoothOnboarding: boolean
  onClose: () => void
  walletConnected: boolean
  hardwareWalletAccounts: Account[]
}

function BluetoothOnboardingDialog(props: BluetoothOnboardingDialogProps) {
  const { hardwareWalletAccounts, onClose, showBluetoothOnboarding, walletConnected } = props

  const classes = useStyles()
  const isSmallScreen = useIsMobile()
  const { t } = useTranslation()

  return (
    <Dialog open={showBluetoothOnboarding} onClose={onClose}>
      <DialogTitle>{t("account.bluetooth-onboarding.title")}</DialogTitle>
      <DialogContent style={{ paddingBottom: isSmallScreen ? 24 : undefined }}>
        <div className={classes.typographyContainer}>
          <Typography
            className={classes.typography}
            variant="body1"
            color={!walletConnected ? "textPrimary" : "textSecondary"}
          >
            {t("account.bluetooth-onboarding.text.info.1")}
          </Typography>
          {!walletConnected ? <CircularProgress size={16} style={{ marginLeft: 8 }} /> : undefined}
        </div>

        <div className={classes.typographyContainer}>
          <Typography
            className={classes.typography}
            variant="body1"
            color={walletConnected && hardwareWalletAccounts.length === 0 ? "textPrimary" : "textSecondary"}
          >
            {t("account.bluetooth-onboarding.text.info.2")}
          </Typography>
          {walletConnected && hardwareWalletAccounts.length === 0 ? (
            <CircularProgress size={16} style={{ marginLeft: 8 }} />
          ) : (
            undefined
          )}
        </div>
        <Typography className={classes.typography} variant="body2" color="textPrimary" style={{ marginTop: 16 }}>
          <Trans i18nKey="account.bluetooth-onboarding.text.hint">
            <b>Hint:</b> You can open more accounts of your hardware wallet by navigating to "Add Accounts".
          </Trans>
        </Typography>
        <DialogActionsBox preventMobileActionsBox smallDialog>
          <ActionButton onClick={props.onClose}>{t("account.bluetooth-onboarding.action.dismiss")}</ActionButton>
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}

interface WindowsOnboardingDialogProps {
  onClose: () => void
  showWindowsOnboarding: boolean
}

function WindowsOnboardingDialog(props: WindowsOnboardingDialogProps) {
  const { onClose, showWindowsOnboarding } = props

  const classes = useStyles()
  const isSmallScreen = useIsMobile()
  const { t } = useTranslation()

  return (
    <Dialog open={showWindowsOnboarding} onClose={onClose}>
      <DialogTitle>{t("account.windows-onboarding.title")}</DialogTitle>
      <DialogContent style={{ paddingBottom: isSmallScreen ? 24 : undefined }}>
        <Typography className={classes.typography} variant="body1" style={{ marginBottom: 16 }}>
          {t("account.windows-onboarding.text.info")}
        </Typography>

        <Typography className={classes.typography} variant="body2">
          {t("account.windows-onboarding.text.step.1")}
        </Typography>
        <Typography className={classes.typography} variant="body2" color="textPrimary" style={{ marginTop: 8 }}>
          {t("account.windows-onboarding.text.step.2")}
        </Typography>
        <Typography className={classes.typography} variant="body2" color="textPrimary" style={{ marginTop: 8 }}>
          {t("account.windows-onboarding.text.step.3")}
        </Typography>
        <Typography className={classes.typography} variant="body2" color="textPrimary" style={{ marginTop: 8 }}>
          {t("account.windows-onboarding.text.step.4")}
        </Typography>
        <Typography className={classes.typography} variant="body2" color="textPrimary" style={{ marginTop: 8 }}>
          {t("account.windows-onboarding.text.step.5")}
        </Typography>
        <DialogActionsBox preventMobileActionsBox smallDialog>
          <ActionButton onClick={() => openLink("https://zadig.akeo.ie/")}>
            {t("account.windows-onboarding.action.download-zadig")}
          </ActionButton>
          <ActionButton onClick={props.onClose}>{t("account.windows-onboarding.action.dismiss")}</ActionButton>
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}

interface Props {
  onClose: () => void
  showBluetoothOnboarding: boolean
  showWindowsOnboarding: boolean
}

function HardwareConnectionHandler(props: Props) {
  const { onClose, showBluetoothOnboarding, showWindowsOnboarding } = props

  const { accounts, createHardwareAccount, deleteAccount } = React.useContext(AccountsContext)

  const [hardwareWalletAccounts, setHardwareWalletAccounts] = React.useState<Account[]>([])
  const [walletConnected, setWalletConnected] = React.useState<boolean>(false)

  const netWorker = useNetWorker()
  const horizonURL = useHorizonURL(false)

  const requestAccounts = React.useCallback(
    async (walletID, accountIndices) => {
      const hardwareAccounts = await requestHardwareAccounts(walletID, accountIndices)
      if (!hardwareAccounts.length) {
        return new Promise<boolean>(resolve =>
          setTimeout(async () => {
            resolve(await requestAccounts(walletID, accountIndices))
          }, 5000)
        )
      }
      const initializedAccounts: Account[] = []
      let shouldFetchMore = false
      for (const account of hardwareAccounts) {
        const accountData = await netWorker.fetchAccountData(horizonURL, account.publicKey)
        if (accountData) {
          // should fetch more if a non-empty account was imported
          shouldFetchMore = true
          const initializedAccountInstance = await createHardwareAccount(account)
          initializedAccounts.push(initializedAccountInstance)
        }
      }

      setHardwareWalletAccounts(prevValue => prevValue.concat(initializedAccounts))

      return shouldFetchMore
    },
    [createHardwareAccount, horizonURL, netWorker]
  )

  const addWallet = React.useCallback(
    async (wallet: HardwareWallet) => {
      setWalletConnected(true)
      const indices = [0, 1, 2, 3, 4]
      let fetchMore = true
      let fetchCounter = 0
      do {
        fetchMore = await requestAccounts(
          wallet.id,
          indices.map(index => index + fetchCounter * indices.length)
        )
        fetchCounter++
      } while (fetchMore)
    },
    [requestAccounts]
  )

  React.useEffect(() => {
    getConnectedWallets().then(wallets => {
      if (wallets.length) {
        setWalletConnected(true)
      }
      for (const wallet of wallets) {
        addWallet(wallet)
      }
    })
  }, [addWallet])

  React.useEffect(() => {
    const unsubscribeWalletAddEvents = subscribeToMessages(Messages.HardwareWalletAdded, addWallet)

    const unsubscribeWalletRemoveEvents = subscribeToMessages(
      Messages.HardwareWalletRemoved,
      (wallet: HardwareWallet) => {
        const removedAccounts = accounts.filter(account => account.id.includes(wallet.id))

        if (removedAccounts) {
          for (const account of removedAccounts) {
            deleteAccount(account.id)
          }
        }
      }
    )

    const unsubscribe = () => {
      unsubscribeWalletAddEvents()
      unsubscribeWalletRemoveEvents()
    }

    return unsubscribe
  }, [accounts, addWallet, createHardwareAccount, deleteAccount, horizonURL, netWorker, requestAccounts])

  React.useEffect(() => {
    if (hardwareWalletAccounts.length > 0) {
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }, [hardwareWalletAccounts, onClose])

  return (
    <>
      <BluetoothOnboardingDialog
        hardwareWalletAccounts={hardwareWalletAccounts}
        showBluetoothOnboarding={showBluetoothOnboarding}
        onClose={onClose}
        walletConnected={walletConnected}
      />
      <WindowsOnboardingDialog showWindowsOnboarding={showWindowsOnboarding} onClose={onClose} />
    </>
  )
}

export default HardwareConnectionHandler

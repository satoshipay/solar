import React from "react"
import { useTranslation } from "react-i18next"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import IconButton from "@material-ui/core/IconButton"
import makeStyles from "@material-ui/core/styles/makeStyles"
import SettingsIcon from "@material-ui/icons/Settings"
import Switch from "@material-ui/core/Switch"
import Tooltip from "@material-ui/core/Tooltip"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import UpdateIcon from "@material-ui/icons/SystemUpdateAlt"
import DialogBody from "~Layout/components/DialogBody"
import { Box, VerticalLayout } from "~Layout/components/Box"
import { Section } from "~Layout/components/Page"
import MainTitle from "~Generic/components/MainTitle"
import { useRouter } from "~Generic/hooks/userinterface"
import getUpdater from "~Platform/updater"
import AppNotificationPermission from "~Toasts/components/AppNotificationPermission"
import ProtocolHandlerPermission from "~Toasts/components/ProtocolHandlerPermission"
import { AccountsContext } from "../contexts/accounts"
import { NotificationsContext, trackError } from "../contexts/notifications"
import { SettingsContext } from "../contexts/settings"
import * as routes from "../routes"
import AccountList from "./AccountList"
import TermsAndConditions from "./TermsAndConditionsDialog"

const useStyles = makeStyles({
  "@keyframes glowing": {
    "0%": { filter: "drop-shadow(0 0 30px #ffffff)" },
    "50%": { filter: "drop-shadow(0 0 0px #ffffff)" },
    "100%": { filter: "drop-shadow(0 0 30px #ffffff)" }
  },

  icon: {
    animation: "$glowing 5000ms infinite"
  }
})

function AllAccountsPage() {
  const { accounts, networkSwitch, toggleNetwork } = React.useContext(AccountsContext)
  const router = useRouter()
  const settings = React.useContext(SettingsContext)
  const { showNotification } = React.useContext(NotificationsContext)
  const testnetAccounts = React.useMemo(() => accounts.filter(account => account.testnet), [accounts])
  const [isUpdateInProgress, setUpdateInProgress] = React.useState(false)
  const { t } = useTranslation()

  const styles = useStyles()
  const isWidthMax450 = useMediaQuery("(max-width:450px)")

  const updater = getUpdater()

  const startUpdate = React.useCallback(async () => {
    if (settings.updateAvailable && !updater.isUpdateStarted() && !updater.isUpdateDownloaded()) {
      try {
        showNotification("info", t("app.all-accounts.update.notification.start"))
        setUpdateInProgress(true)
        await updater.startUpdate()
        showNotification("success", t("app.all-accounts.update.notification.success"))
      } catch (error) {
        trackError(error)
      } finally {
        setUpdateInProgress(false)
      }
    }
  }, [settings.updateAvailable, showNotification, updater, t])

  const updateButton = (
    <Tooltip title={t("app.all-accounts.update.tooltip")}>
      <IconButton
        onClick={startUpdate}
        color="secondary"
        style={{ marginLeft: isWidthMax450 ? 0 : 8, marginRight: -12, color: "inherit" }}
      >
        <UpdateIcon className={styles.icon}></UpdateIcon>
      </IconButton>
    </Tooltip>
  )

  const networkSwitchButton = (
    <FormControlLabel
      control={<Switch checked={networkSwitch === "testnet"} color="secondary" onChange={toggleNetwork} />}
      label={t("app.all-accounts.switch.label")}
      style={{ marginRight: 0 }}
    />
  )

  const headerContent = React.useMemo(
    () => (
      <MainTitle
        title={networkSwitch === "testnet" ? t("app.all-accounts.title.testnet") : t("app.all-accounts.title.mainnet")}
        titleColor="inherit"
        titleStyle={isWidthMax450 ? { marginRight: 0 } : {}}
        hideBackButton
        onBack={() => undefined}
        actions={
          <Box style={{ marginLeft: "auto" }}>
            {settings.showTestnet || networkSwitch === "testnet" || testnetAccounts.length > 0
              ? networkSwitchButton
              : null}
            {settings.updateAvailable &&
            !isUpdateInProgress &&
            !updater.isUpdateStarted() &&
            !updater.isUpdateDownloaded()
              ? updateButton
              : null}
            <IconButton
              onClick={() => router.history.push(routes.settings())}
              style={{ marginLeft: isWidthMax450 ? 0 : 8, marginRight: -12, color: "inherit" }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        }
      />
    ),
    [
      isUpdateInProgress,
      isWidthMax450,
      networkSwitch,
      networkSwitchButton,
      router.history,
      settings.showTestnet,
      settings.updateAvailable,
      testnetAccounts.length,
      updater,
      updateButton,
      t
    ]
  )

  return (
    <Section bottom brandColored noPadding style={{ height: "100vh" }}>
      <DialogBody backgroundColor="unset" top={headerContent}>
        <VerticalLayout justifyContent="space-between" grow margin="16px 0 0">
          <AccountList
            accounts={accounts}
            testnet={networkSwitch === "testnet"}
            onCreatePubnetAccount={() => router.history.push(routes.newAccount(false))}
            onCreateTestnetAccount={() => router.history.push(routes.newAccount(true))}
          />
          <AppNotificationPermission />
          {process.env.PLATFORM === "linux" || process.env.PLATFORM === "darwin" || process.env.PLATFORM === "win32" ? (
            <ProtocolHandlerPermission />
          ) : null}
        </VerticalLayout>
      </DialogBody>
      <TermsAndConditions
        // Do not render T&Cs while loading settings; 99.9% chance we will unmount it immediately
        open={settings.initialized && !settings.agreedToTermsAt}
        onConfirm={settings.confirmToC}
      />
    </Section>
  )
}

export default React.memo(AllAccountsPage)

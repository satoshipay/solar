import React from "react"
import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import makeStyles from "@material-ui/core/styles/makeStyles"
import SettingsIcon from "@material-ui/icons/Settings"
import Tooltip from "@material-ui/core/Tooltip"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import UpdateIcon from "@material-ui/icons/SystemUpdateAlt"
import AccountList from "../components/AccountList"
import DialogBody from "../components/Dialog/DialogBody"
import { Box, VerticalLayout } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import MainTitle from "../components/MainTitle"
import TermsAndConditions from "../components/TermsAndConditionsDialog"
import AppNotificationPermission from "../components/Toasts/AppNotificationPermission"
import { AccountsContext } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import { useIsMobile, useRouter } from "../hooks/userinterface"
import * as routes from "../routes"
import { NotificationsContext, trackError } from "../context/notifications"
import getUpdater from "../platform/updater"

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
  const [isUpdateAvailable, setUpdateAvailable] = React.useState(false)
  const [isUpdateInProgress, setUpdateInProgress] = React.useState(false)

  const styles = useStyles()
  const isSmallScreen = useIsMobile()
  const isWidthMax450 = useMediaQuery("(max-width:450px)")

  const switchToMainnetLabel = isSmallScreen ? "Mainnet" : "Switch To Mainnet"
  const switchToTestnetLabel = isSmallScreen ? "Testnet" : "Switch To Testnet"

  const updater = getUpdater()

  React.useEffect(() => {
    updater.isUpdateAvailable().then(value => {
      setUpdateAvailable(value)
    })
  }, [])

  const startUpdate = React.useCallback(async () => {
    if (isUpdateAvailable && !updater.isUpdateStarted()) {
      try {
        showNotification("info", "Starting download of update...")
        setUpdateInProgress(true)
        await updater.startUpdate()
        showNotification("success", "Download is ready and will be installed on next restart!")
      } catch (error) {
        trackError(error)
      } finally {
        setUpdateInProgress(false)
      }
    }
  }, [updater, isUpdateAvailable])

  const updateButton = (
    <Tooltip title="Update available">
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
    <Button color="inherit" variant="outlined" onClick={toggleNetwork} style={{ borderColor: "white" }}>
      {networkSwitch === "testnet" ? switchToMainnetLabel : switchToTestnetLabel}
    </Button>
  )

  const headerContent = React.useMemo(
    () => (
      <MainTitle
        title={networkSwitch === "testnet" ? "Testnet Accounts" : "My Accounts"}
        titleColor="inherit"
        titleStyle={isWidthMax450 ? { marginRight: 0 } : {}}
        hideBackButton
        onBack={() => undefined}
        actions={
          <Box style={{ marginLeft: "auto" }}>
            {settings.showTestnet || networkSwitch === "testnet" || testnetAccounts.length > 0
              ? networkSwitchButton
              : null}
            {isUpdateAvailable && !isUpdateInProgress ? updateButton : null}
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
    [isWidthMax450, isUpdateAvailable, isUpdateInProgress, networkSwitch, router, settings.showTestnet, testnetAccounts]
  )

  return (
    <Section top bottom brandColored noPadding style={{ height: "100vh" }}>
      <DialogBody brandColored top={headerContent}>
        <VerticalLayout justifyContent="space-between" grow margin="16px 0 0">
          <AccountList
            accounts={accounts}
            testnet={networkSwitch === "testnet"}
            onCreatePubnetAccount={() => router.history.push(routes.createAccount(false))}
            onCreateTestnetAccount={() => router.history.push(routes.createAccount(true))}
          />
          <AppNotificationPermission />
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

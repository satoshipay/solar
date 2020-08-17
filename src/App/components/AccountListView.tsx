import React from "react"
import { useTranslation } from "react-i18next"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import IconButton from "@material-ui/core/IconButton"
import makeStyles from "@material-ui/core/styles/makeStyles"
import SettingsIcon from "@material-ui/icons/Settings"
import Tooltip from "@material-ui/core/Tooltip"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import UpdateIcon from "@material-ui/icons/SystemUpdateAlt"
import EnableBluetoothIcon from "@material-ui/icons/Bluetooth"
import DisableBluetoothIcon from "@material-ui/icons/BluetoothDisabled"
import HardwareAccountIcon from "@material-ui/icons/Memory"
import DialogBody from "~Layout/components/DialogBody"
import { Box, VerticalLayout } from "~Layout/components/Box"
import { Section } from "~Layout/components/Page"
import MainTitle from "~Generic/components/MainTitle"
import { useIsMobile, useRouter } from "~Generic/hooks/userinterface"
import getUpdater from "~Platform/updater"
import {
  isBluetoothAvailable,
  isDiscoveryRunning,
  stopBluetoothDiscovery,
  startBluetoothDiscovery
} from "~Platform/hardware-wallet"
import AppNotificationPermission from "~Toasts/components/AppNotificationPermission"
import { AccountsContext } from "../contexts/accounts"
import { NotificationsContext, trackError } from "../contexts/notifications"
import { SettingsContext } from "../contexts/settings"
import * as routes from "../routes"
import AccountList from "./AccountList"
import TermsAndConditions from "./TermsAndConditionsDialog"

const isDesktopApplication = process.env.PLATFORM !== "ios" && process.env.PLATFORM !== "android"
const isWindowsApplication = process.env.PLATFORM === "win32"
const bluetoothSupported = process.env.PLATFORM === "darwin" // bluetooth currently only works on macOS
const HardwareConnectionHandler = isDesktopApplication
  ? React.lazy(() => import("~Account/components/HardwareConnectionHandler"))
  : undefined

const useStyles = makeStyles({
  "@keyframes glowing": {
    "0%": { filter: "drop-shadow(0 0 30px #ffffff)" },
    "50%": { filter: "drop-shadow(0 0 0px #ffffff)" },
    "100%": { filter: "drop-shadow(0 0 30px #ffffff)" }
  },

  icon: {
    animation: "$glowing 5000ms infinite"
  },
  bluetoothProgress: {
    position: "absolute",
    top: 6,
    left: 14,
    zIndex: -1
  },
  root: {
    display: "inline-flex",
    alignItems: "center"
  },
  wrapper: {
    margin: 8,
    position: "relative"
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

  const [bluetoothAvailable, setBluetoothAvailable] = React.useState(false)
  const [bluetoothDiscoveryRunning, setBluetoothDiscoveryRunning] = React.useState(isDiscoveryRunning)
  const [bluetoothOnboarding, setBluetoothOnboarding] = React.useState(false)
  const [windowsOnboarding, setWindowsOnboarding] = React.useState(false)

  const classes = useStyles()
  const isSmallScreen = useIsMobile()
  const isWidthMax450 = useMediaQuery("(max-width:450px)")

  const switchToMainnetLabel = isSmallScreen
    ? t("app.all-accounts.switch.to-mainnet.short")
    : t("app.all-accounts.switch.to-mainnet.long")
  const switchToTestnetLabel = isSmallScreen
    ? t("app.all-accounts.switch.to-testnet.short")
    : t("app.all-accounts.switch.to-testnet.long")

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
        <UpdateIcon className={classes.icon}></UpdateIcon>
      </IconButton>
    </Tooltip>
  )

  React.useEffect(() => {
    function pollBluetoothState() {
      isBluetoothAvailable().then(setBluetoothAvailable)
    }

    pollBluetoothState()
    setInterval(() => {
      pollBluetoothState()
    }, 5000)
  }, [])

  const toggleBluetoothDiscovery = React.useCallback(async () => {
    try {
      if (!bluetoothDiscoveryRunning) {
        startBluetoothDiscovery().then(() => {
          setBluetoothOnboarding(true)
          setBluetoothDiscoveryRunning(true)
        })
      } else {
        stopBluetoothDiscovery().then(() => setBluetoothDiscoveryRunning(false))
      }
    } catch (error) {
      trackError(error)
    }
  }, [bluetoothDiscoveryRunning])

  const bluetoothButton = (
    <Tooltip
      title={
        !bluetoothAvailable
          ? "Bluetooth not available"
          : bluetoothDiscoveryRunning
          ? "Stop Bluetooth Discovery"
          : "Start Bluetooth Discovery"
      }
    >
      <div className={classes.root}>
        <div className={classes.wrapper}>
          <IconButton
            disabled={!bluetoothAvailable}
            onClick={toggleBluetoothDiscovery}
            color="secondary"
            style={{
              marginLeft: 8,
              marginRight: -12,
              color: "inherit",
              opacity: !bluetoothAvailable ? 0.5 : undefined
            }}
          >
            {bluetoothDiscoveryRunning ? <EnableBluetoothIcon /> : <DisableBluetoothIcon />}
          </IconButton>
          {bluetoothDiscoveryRunning && <CircularProgress size={36} className={classes.bluetoothProgress} />}
        </div>
      </div>
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
            {bluetoothSupported ? bluetoothButton : undefined}
            {isWindowsApplication ? (
              <IconButton
                onClick={() => setWindowsOnboarding(true)}
                style={{ marginLeft: isWidthMax450 ? 0 : 8, marginRight: -12, color: "inherit" }}
              >
                <HardwareAccountIcon />
              </IconButton>
            ) : (
              undefined
            )}
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
      bluetoothButton,
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
        </VerticalLayout>
      </DialogBody>
      <TermsAndConditions
        // Do not render T&Cs while loading settings; 99.9% chance we will unmount it immediately
        open={settings.initialized && !settings.agreedToTermsAt}
        onConfirm={settings.confirmToC}
      />
      <React.Suspense fallback={null}>
        {HardwareConnectionHandler && (
          <HardwareConnectionHandler
            showBluetoothOnboarding={bluetoothOnboarding}
            showWindowsOnboarding={windowsOnboarding}
            onClose={() => {
              setBluetoothOnboarding(false)
              setWindowsOnboarding(false)
            }}
          />
        )}
      </React.Suspense>
    </Section>
  )
}

export default React.memo(AllAccountsPage)

import React from "react"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import IconButton from "@material-ui/core/IconButton"
import SettingsIcon from "@material-ui/icons/Settings"
import AccountList from "../components/AccountList"
import DialogBody from "../components/Dialog/DialogBody"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import MainTitle from "../components/MainTitle"
import OnboardingDialog from "../components/Account/OnboardingDialog"
import TermsAndConditions from "../components/TermsAndConditionsDialog"
import { AccountsContext } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import { useIsMobile, useRouter } from "../hooks/userinterface"
import * as routes from "../routes"
import { CompactDialogTransition } from "../theme"

function AllAccountsPage() {
  const { accounts, networkSwitch, toggleNetwork } = React.useContext(AccountsContext)
  const router = useRouter()
  const settings = React.useContext(SettingsContext)
  const testnetAccounts = React.useMemo(() => accounts.filter(account => account.testnet), [accounts])

  const [onboardingClosed, setOnboardingClosed] = React.useState(false) // TODO move this to settings context or similar

  const isSmallScreen = useIsMobile()
  const isWidthMax450 = useMediaQuery("(max-width:450px)")

  const switchToMainnetLabel = isSmallScreen ? "Mainnet" : "Switch To Mainnet"
  const switchToTestnetLabel = isSmallScreen ? "Testnet" : "Switch To Testnet"

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
    [isWidthMax450, networkSwitch, router, settings.showTestnet, testnetAccounts]
  )

  return (
    <Section top bottom brandColored noPadding style={{ height: "100vh" }}>
      <DialogBody top={headerContent}>
        <Box margin="16px 0 0">
          <AccountList
            accounts={accounts}
            testnet={networkSwitch === "testnet"}
            onCreatePubnetAccount={() => router.history.push(routes.createAccount(false))}
            onCreateTestnetAccount={() => router.history.push(routes.createAccount(true))}
          />
        </Box>
      </DialogBody>
      <Dialog
        fullWidth
        maxWidth="md"
        open={accounts.length === 0 && !onboardingClosed}
        TransitionComponent={CompactDialogTransition}
      >
        <OnboardingDialog onClose={() => setOnboardingClosed(true)} />
      </Dialog>
      <TermsAndConditions open={!settings.agreedToTermsAt} onConfirm={settings.confirmToC} />
    </Section>
  )
}

export default React.memo(AllAccountsPage)

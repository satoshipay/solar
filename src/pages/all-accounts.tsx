import React from "react"
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"
import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import SettingsIcon from "@material-ui/icons/Settings"
import TermsAndConditions from "../components/Dialog/TermsAndConditions"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import AccountList from "../components/AccountList"
import MainTitle from "../components/MainTitle"
import { AccountsContext } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import { useIsMobile, useRouter } from "../hooks"
import * as routes from "../routes"

function AllAccountsPage() {
  const { accounts, networkSwitch, toggleNetwork } = React.useContext(AccountsContext)
  const router = useRouter()
  const settings = React.useContext(SettingsContext)
  const testnetAccounts = accounts.filter(account => account.testnet)

  const isSmallScreen = useIsMobile()
  const isWidthMax450 = useMediaQuery("(max-width:450px)")

  const switchToMainnetLabel = isSmallScreen ? "Mainnet" : "Switch To Mainnet"
  const switchToTestnetLabel = isSmallScreen ? "Testnet" : "Switch To Testnet"

  const networkSwitchButton = (
    <Button color="inherit" variant="outlined" onClick={toggleNetwork} style={{ borderColor: "white" }}>
      {networkSwitch === "testnet" ? switchToMainnetLabel : switchToTestnetLabel}
    </Button>
  )
  return (
    <Section top brandColored>
      <Box margin="16px 24px" style={{ position: "relative" }}>
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
        <Box margin="16px 0 0">
          <AccountList
            accounts={accounts}
            testnet={networkSwitch === "testnet"}
            onCreatePubnetAccount={() => router.history.push(routes.createAccount(false))}
            onCreateTestnetAccount={() => router.history.push(routes.createAccount(true))}
          />
        </Box>
      </Box>
      <TermsAndConditions open={!settings.agreedToTermsAt} onConfirm={settings.confirmToC} />
    </Section>
  )
}

export default AllAccountsPage

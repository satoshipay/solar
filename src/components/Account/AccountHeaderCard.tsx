import React from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import makeStyles from "@material-ui/core/styles/makeStyles"
import MenuIcon from "@material-ui/icons/Menu"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useIsMobile, useRouter } from "../../hooks/userinterface"
import { matchesRoute } from "../../lib/routes"
import * as routes from "../../routes"
import { breakpoints } from "../../theme"
import { Box } from "../Layout/Box"
import withFallback from "../Lazy/withFallback"
import ViewLoading from "../ViewLoading"
import AccountTitle, { Badges } from "./AccountTitle"

const AccountContextMenu = withFallback(
  React.lazy(() => import("./AccountContextMenu")),
  <ViewLoading style={{ justifyContent: "flex-end" }} />
)

const useAccountHeaderStyles = makeStyles({
  button: {
    fontSize: 32,
    marginRight: -4,
    padding: 6,

    [breakpoints.down(600)]: {
      marginRight: -12
    }
  },
  closeButton: {
    boxSizing: "content-box",
    width: 32,
    height: 32
  },
  menuButton: {}
})

interface Props {
  account: Account
  children?: React.ReactNode
  editableAccountName?: boolean
  onAccountSettings: () => void
  onAccountTransactions: () => void
  onClose: () => void
  onDeposit: () => void
  onManageAssets: () => void
  onTrade: () => void
  onWithdraw: () => void
}

function AccountHeaderCard(props: Props) {
  const classes = useAccountHeaderStyles()
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const settings = React.useContext(SettingsContext)

  const handleBackNavigation = React.useCallback(() => {
    if (matchesRoute(router.location.pathname, routes.accountSettings(props.account.id))) {
      router.history.push(routes.account(props.account.id))
    } else {
      router.history.push(routes.allAccounts())
    }
  }, [props.account, router.history, router.location])

  const showingSettings = matchesRoute(router.location.pathname, routes.accountSettings("*"))

  const actions = React.useMemo(
    () => (
      <Box alignItems="center" display="flex" height={44} justifyContent="flex-end">
        <AccountContextMenu
          account={props.account}
          onAccountSettings={props.onAccountSettings}
          onAccountTransactions={props.onAccountTransactions}
          onDeposit={props.onDeposit}
          onManageAssets={props.onManageAssets}
          onTrade={props.onTrade}
          onWithdraw={props.onWithdraw}
          settings={settings}
          showingSettings={showingSettings}
        >
          {({ onOpen }) => (
            <IconButton className={`${classes.button} ${classes.menuButton}`} color="inherit" onClick={onOpen}>
              <MenuIcon style={{ fontSize: "inherit" }} />
            </IconButton>
          )}
        </AccountContextMenu>
      </Box>
    ),
    [
      classes.button,
      classes.menuButton,
      props.account,
      props.onAccountSettings,
      props.onAccountTransactions,
      props.onDeposit,
      props.onManageAssets,
      props.onTrade,
      props.onWithdraw,
      settings,
      showingSettings
    ]
  )

  const badges = React.useMemo(
    () => (
      <React.Suspense fallback={null}>
        <Badges account={props.account} />
      </React.Suspense>
    ),
    [props.account]
  )

  return (
    <Card
      style={{
        color: "white",
        position: "relative",
        background: "transparent",
        boxShadow: "none",
        overflow: "visible"
      }}
    >
      <CardContent style={isSmallScreen ? { padding: 8 } : undefined}>
        <React.Suspense fallback={null}>
          <AccountTitle
            // set the key to force the component to remount on account change
            // in order to clear the component state containing a copy of the account title
            key={props.account.id}
            account={props.account}
            actions={actions}
            badges={badges}
            editable={props.editableAccountName}
            onNavigateBack={handleBackNavigation}
          />
        </React.Suspense>
        {props.children}
      </CardContent>
    </Card>
  )
}

export default AccountHeaderCard

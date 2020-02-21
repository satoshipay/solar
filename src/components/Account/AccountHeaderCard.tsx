import React from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import MenuIcon from "@material-ui/icons/Menu"
import makeStyles from "@material-ui/core/styles/makeStyles"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useIsMobile, useRouter } from "../../hooks/userinterface"
import { matchesRoute } from "../../lib/routes"
import * as routes from "../../routes"
import { breakpoints } from "../../theme"
import { Box } from "../Layout/Box"
import withFallback from "../Lazy/withFallback"
import ViewLoading from "../ViewLoading"
import AccountTitle, { Badges, StaticBadges } from "./AccountTitle"

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

export interface AccountCreation {
  multisig: boolean
  name: string
  requiresPassword: boolean
  testnet: boolean
}

interface Props {
  account: Account | AccountCreation
  children?: React.ReactNode
  editableAccountName?: boolean
  onAccountSettings?: () => void
  onAccountTransactions?: () => void
  onClose?: () => void
  onDeposit?: () => void
  onManageAssets?: () => void
  onRename: (newName: string) => void
  onTrade?: () => void
  onWithdraw?: () => void
}

function AccountHeaderCard(props: Props) {
  const classes = useAccountHeaderStyles()
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const settings = React.useContext(SettingsContext)

  const meta =
    "publicKey" in props.account
      ? ({ account: props.account as Account } as const)
      : ({ accountCreation: props.account as AccountCreation } as const)

  const handleBackNavigation = React.useCallback(() => {
    if (meta.account && matchesRoute(router.location.pathname, routes.accountSettings(meta.account.id))) {
      router.history.push(routes.account(meta.account.id))
    } else {
      router.history.push(routes.allAccounts())
    }
  }, [meta.account, router.history, router.location])

  const showingSettings = matchesRoute(router.location.pathname, routes.accountSettings("*"))

  const actions = React.useMemo(
    () => (
      <Box alignItems="center" display="flex" height={44} justifyContent="flex-end">
        {meta.account ? (
          <AccountContextMenu
            account={meta.account}
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
        ) : null}
      </Box>
    ),
    [
      classes.button,
      classes.menuButton,
      meta.account,
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
        {meta.account ? (
          <Badges account={meta.account} />
        ) : (
          <StaticBadges
            multisig={meta.accountCreation.multisig ? "generic" : undefined}
            password={meta.accountCreation.requiresPassword}
            testnet={meta.accountCreation.testnet}
          />
        )}
      </React.Suspense>
    ),
    [meta.account, meta.accountCreation]
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
            key={meta.account?.id}
            actions={actions}
            badges={badges}
            editable={props.editableAccountName}
            permanentlyEditing={!meta.account}
            name={meta.account?.name || meta.accountCreation!.name}
            onNavigateBack={handleBackNavigation}
            onRename={props.onRename}
          />
        </React.Suspense>
        {props.children}
      </CardContent>
    </Card>
  )
}

export default AccountHeaderCard

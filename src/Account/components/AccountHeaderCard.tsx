import React from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import MenuIcon from "@material-ui/icons/Menu"
import makeStyles from "@material-ui/core/styles/makeStyles"
import { Account } from "~App/contexts/accounts"
import { SettingsContext } from "~App/contexts/settings"
import { useIsMobile, useRouter } from "~Generic/hooks/userinterface"
import { matchesRoute } from "~Generic/lib/routes"
import * as routes from "~App/routes"
import { breakpoints } from "~App/theme"
import { AccountCreation } from "~AccountCreation/types/types"
import { HideOnError } from "~Generic/components/ErrorBoundaries"
import ViewLoading from "~Generic/components/ViewLoading"
import withFallback from "~Generic/hocs/withFallback"
import { Box } from "~Layout/components/Box"
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

interface Props {
  account: Account | AccountCreation
  children?: React.ReactNode
  editableAccountName?: boolean
  error?: string
  onAccountSettings?: () => void
  onAccountTransactions?: () => void
  onClose: () => void
  onDeposit?: () => void
  onManageAssets?: () => void
  onPurchaseLumens?: () => void
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

  // It should never happen that "Unnamed account" is used
  // It is only added for the rare case that the user has renamed their account to "" which is prevented by now
  const name = meta.account?.name || meta.accountCreation?.name || "Unnamed Account"

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
            onPurchaseLumens={props.onPurchaseLumens}
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
      props.onPurchaseLumens,
      props.onTrade,
      props.onWithdraw,
      settings,
      showingSettings
    ]
  )

  const badges = React.useMemo(
    () => (
      <HideOnError>
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
      </HideOnError>
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
            badges={meta.account || props.editableAccountName ? badges : null}
            editable={props.editableAccountName}
            error={props.error}
            permanentlyEditing={props.editableAccountName && !meta.account}
            name={name}
            onNavigateBack={props.onClose}
            onRename={props.onRename}
          />
        </React.Suspense>
        {props.children}
      </CardContent>
    </Card>
  )
}

export default AccountHeaderCard

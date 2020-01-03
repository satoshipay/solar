import React from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import makeStyles from "@material-ui/core/styles/makeStyles"
import CloseIcon from "@material-ui/icons/Close"
import MenuIcon from "@material-ui/icons/Menu"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useIsMobile } from "../../hooks/userinterface"
import { breakpoints } from "../../theme"
import InlineLoader from "../InlineLoader"
import { Box } from "../Layout/Box"
import withFallback from "../Lazy/withFallback"
import ViewLoading from "../ViewLoading"
import AccountTitle, { Badges } from "./AccountTitle"

const AccountContextMenu = withFallback(React.lazy(() => import("./AccountContextMenu")), <ViewLoading />)

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
  onClose: () => void
  onDeposit: () => void
  onManageAssets: () => void
  onTrade: () => void
  onWithdraw: () => void
  showCloseButton?: boolean
}

function AccountHeaderCard(props: Props) {
  const classes = useAccountHeaderStyles()
  const isSmallScreen = useIsMobile()
  const settings = React.useContext(SettingsContext)

  const actions = React.useMemo(
    () => (
      <Box alignItems="center" display="flex" height={44} justifyContent="flex-end">
        <React.Suspense fallback={null}>
          {props.showCloseButton ? (
            <IconButton className={`${classes.button} ${classes.closeButton}`} color="inherit" onClick={props.onClose}>
              <CloseIcon />
            </IconButton>
          ) : (
            <AccountContextMenu
              account={props.account}
              onAccountSettings={props.onAccountSettings}
              onDeposit={props.onDeposit}
              onManageAssets={props.onManageAssets}
              onTrade={props.onTrade}
              onWithdraw={props.onWithdraw}
              settings={settings}
            >
              {({ onOpen }) => (
                <IconButton className={`${classes.button} ${classes.menuButton}`} color="inherit" onClick={onOpen}>
                  <MenuIcon style={{ fontSize: "inherit" }} />
                </IconButton>
              )}
            </AccountContextMenu>
          )}
        </React.Suspense>
      </Box>
    ),
    [props.account, props.onAccountSettings, props.onTrade, props.onWithdraw, props.showCloseButton, settings]
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
        <React.Suspense fallback={<InlineLoader />}>
          <AccountTitle
            account={props.account}
            actions={actions}
            badges={
              <React.Suspense fallback={null}>
                <Badges account={props.account} />
              </React.Suspense>
            }
            editable={props.editableAccountName}
          />
        </React.Suspense>
        {props.children}
      </CardContent>
    </Card>
  )
}

export default AccountHeaderCard

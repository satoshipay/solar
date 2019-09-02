import React from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import makeStyles from "@material-ui/core/styles/makeStyles"
import CloseIcon from "@material-ui/icons/Close"
import MenuIcon from "@material-ui/icons/Menu"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useAccountData, useIsMobile } from "../../hooks"
import { Box } from "../Layout/Box"
import AccountContextMenu from "./AccountContextMenu"
import AccountTitle from "./AccountTitle"
import { breakpoints } from "../../theme"

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
  onManageAssets: () => void
  onTrade: () => void
  onWithdraw: () => void
  showCloseButton?: boolean
  style?: React.CSSProperties
}

function AccountHeaderCard(props: Props) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const classes = useAccountHeaderStyles({})
  const isSmallScreen = useIsMobile()
  const settings = React.useContext(SettingsContext)

  const actions = React.useMemo(
    () => (
      <Box alignItems="center" display="flex" height={56} justifyContent="flex-end">
        {props.showCloseButton ? (
          <IconButton className={`${classes.button} ${classes.closeButton}`} color="inherit" onClick={props.onClose}>
            <CloseIcon />
          </IconButton>
        ) : (
          <AccountContextMenu
            account={props.account}
            activated={accountData.activated}
            onAccountSettings={props.onAccountSettings}
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
      </Box>
    ),
    [
      props.account,
      accountData.activated,
      props.onAccountSettings,
      props.onTrade,
      props.onWithdraw,
      props.showCloseButton,
      settings
    ]
  )

  return (
    <Card
      style={{
        color: "white",
        position: "relative",
        background: "transparent",
        boxShadow: "none",
        overflow: "visible",
        ...props.style
      }}
    >
      <CardContent style={isSmallScreen ? { padding: 8 } : undefined}>
        <AccountTitle
          account={props.account}
          accountData={accountData}
          actions={actions}
          editable={props.editableAccountName}
        />
        {props.children}
      </CardContent>
    </Card>
  )
}

export default AccountHeaderCard

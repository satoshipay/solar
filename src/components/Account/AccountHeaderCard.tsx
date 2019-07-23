import React from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import CloseIcon from "@material-ui/icons/Close"
import MoreVertIcon from "@material-ui/icons/MoreVert"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useAccountData, useIsMobile } from "../../hooks"
import { Box } from "../Layout/Box"
import AccountContextMenu from "./AccountContextMenu"
import AccountTitle from "./AccountTitle"

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
  const isSmallScreen = useIsMobile()
  const settings = React.useContext(SettingsContext)
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

  const actions = React.useMemo(
    () => (
      <Box height={56}>
        {props.showCloseButton ? (
          <IconButton
            color="inherit"
            onClick={props.onClose}
            style={{ boxSizing: "content-box", width: 32, height: 32, marginRight: -16, fontSize: 32 }}
          >
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
              <IconButton color="inherit" onClick={onOpen} style={{ marginRight: -16, fontSize: 32 }}>
                <MoreVertIcon style={{ fontSize: "inherit" }} />
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

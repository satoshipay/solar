import React from "react"
import Dialog from "@material-ui/core/Dialog"
import List from "@material-ui/core/List"
import ListItemText from "@material-ui/core/ListItemText"
import Slide from "@material-ui/core/Slide"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import EyeIcon from "@material-ui/icons/RemoveRedEye"
import DeleteIcon from "@material-ui/icons/Delete"
import GroupIcon from "@material-ui/icons/Group"
import KeyIcon from "@material-ui/icons/VpnKey"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useAccountData, useIsMobile, useRouter } from "../../hooks"
import { matchesRoute } from "../../lib/routes"
import * as routes from "../../routes"
import AccountDeletionDialog from "./AccountDeletionDialog"
import AccountSettingsItem from "./AccountSettingsItem"
import ChangePasswordDialog from "./ChangePasswordDialog"
import ExportKeyDialog from "./ExportKeyDialog"
import ManageSignersDialog from "./ManageSignersDialog"

const Transition = React.forwardRef((props: TransitionProps, ref) => <Slide ref={ref} {...props} direction="left" />)

function SettingsDialogs(props: Props) {
  const router = useRouter()

  const showChangePassword = matchesRoute(router.location.pathname, routes.changeAccountPassword("*"))
  const showDeleteAccount = matchesRoute(router.location.pathname, routes.deleteAccount("*"))
  const showExportKey = matchesRoute(router.location.pathname, routes.exportSecretKey("*"))
  const showManageSigners = matchesRoute(router.location.pathname, routes.manageAccountSigners("*"))

  const navigateTo = React.useMemo(
    () => ({
      accountSettings: () => router.history.push(routes.accountSettings(props.account.id)),
      allAccounts: () => router.history.push(routes.allAccounts())
    }),
    [router.history, props.account]
  )

  return (
    <>
      <Dialog fullScreen open={showManageSigners} onClose={navigateTo.accountSettings} TransitionComponent={Transition}>
        <ManageSignersDialog account={props.account} onClose={navigateTo.accountSettings} />
      </Dialog>
      <Dialog
        fullScreen
        open={showChangePassword}
        onClose={navigateTo.accountSettings}
        TransitionComponent={Transition}
      >
        <ChangePasswordDialog account={props.account} onClose={navigateTo.accountSettings} />
      </Dialog>
      <Dialog fullScreen open={showDeleteAccount} onClose={navigateTo.accountSettings} TransitionComponent={Transition}>
        <AccountDeletionDialog
          account={props.account}
          onClose={navigateTo.accountSettings}
          onDeleted={navigateTo.allAccounts}
        />
      </Dialog>
      <Dialog fullScreen open={showExportKey} onClose={navigateTo.accountSettings} TransitionComponent={Transition}>
        <ExportKeyDialog account={props.account} onClose={navigateTo.accountSettings} variant="export" />
      </Dialog>
    </>
  )
}

interface Props {
  account: Account
}

function AccountSettings(props: Props) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const settings = React.useContext(SettingsContext)

  const navigateTo = React.useMemo(
    () => ({
      changePassword: () => router.history.push(routes.changeAccountPassword(props.account.id)),
      deleteAccount: () => router.history.push(routes.deleteAccount(props.account.id)),
      exportSecretKey: () => router.history.push(routes.exportSecretKey(props.account.id)),
      manageSigners: () => router.history.push(routes.manageAccountSigners(props.account.id))
    }),
    [router.history, props.account]
  )

  const listItemTextStyle: React.CSSProperties = React.useMemo(
    () => ({
      paddingRight: isSmallScreen ? 0 : undefined
    }),
    [isSmallScreen]
  )

  return (
    <>
      <List style={{ padding: isSmallScreen ? "0 8px" : "24px 16px" }}>
        <AccountSettingsItem icon={<KeyIcon style={{ fontSize: "100%" }} />} onClick={navigateTo.changePassword}>
          <ListItemText
            primary={props.account.requiresPassword ? "Change Password" : "Set Password"}
            secondary={
              props.account.requiresPassword
                ? "Your account is secure, protected by a password"
                : "Your account is not protected"
            }
            style={listItemTextStyle}
          />
        </AccountSettingsItem>
        {settings.multiSignature ? (
          <AccountSettingsItem
            disabled={!accountData.activated}
            icon={<GroupIcon style={{ fontSize: "100%" }} />}
            onClick={navigateTo.manageSigners}
          >
            <ListItemText
              primary="Multi-Signature"
              secondary={isSmallScreen ? "Manage co-signers" : "Make account multi-signature and manage co-signers"}
              style={listItemTextStyle}
            />
          </AccountSettingsItem>
        ) : null}
        <AccountSettingsItem icon={<EyeIcon style={{ fontSize: "100%" }} />} onClick={navigateTo.exportSecretKey}>
          <ListItemText
            primary="Export Secret Key"
            secondary="Decrypt and show private key"
            style={listItemTextStyle}
          />
        </AccountSettingsItem>
        <AccountSettingsItem icon={<DeleteIcon style={{ fontSize: "100%" }} />} onClick={navigateTo.deleteAccount}>
          <ListItemText primary="Merge or Delete Account" style={listItemTextStyle} />
        </AccountSettingsItem>
      </List>
      <SettingsDialogs account={props.account} />
    </>
  )
}

export default React.memo(AccountSettings)

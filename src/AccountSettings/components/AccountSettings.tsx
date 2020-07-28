import React from "react"
import { useTranslation } from "react-i18next"
import List from "@material-ui/core/List"
import ListItemText from "@material-ui/core/ListItemText"
import EyeIcon from "@material-ui/icons/RemoveRedEye"
import DeleteIcon from "@material-ui/icons/Delete"
import GroupIcon from "@material-ui/icons/Group"
import KeyIcon from "@material-ui/icons/VpnKey"
import { Account } from "~App/contexts/accounts"
import { SettingsContext } from "~App/contexts/settings"
import * as routes from "~App/routes"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { useIsMobile, useRouter } from "~Generic/hooks/userinterface"
import { matchesRoute } from "~Generic/lib/routes"
import Carousel from "~Layout/components/Carousel"
import ManageSignersDialog from "~ManageSigners/components/ManageSignersDialog"
import AccountDeletionDialog from "./AccountDeletionDialog"
import AccountSettingsItem from "./AccountSettingsItem"
import ChangePasswordDialog from "./ChangePasswordDialog"
import ExportKeyDialog from "./ExportKeyDialog"

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
      <div style={{ display: showChangePassword ? undefined : "none" }}>
        <ChangePasswordDialog account={props.account} onClose={navigateTo.accountSettings} />
      </div>
      <div style={{ display: showDeleteAccount ? undefined : "none" }}>
        <AccountDeletionDialog
          account={props.account}
          onClose={navigateTo.accountSettings}
          onDeleted={navigateTo.allAccounts}
        />
      </div>
      <div style={{ display: showExportKey ? undefined : "none" }}>
        <ExportKeyDialog account={props.account} onClose={navigateTo.accountSettings} variant="export" />
      </div>
      <div style={{ display: showManageSigners ? undefined : "none" }}>
        <ManageSignersDialog account={props.account} onClose={navigateTo.accountSettings} />
      </div>
    </>
  )
}

interface Props {
  account: Account
}

function AccountSettings(props: Props) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const { t } = useTranslation()
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

  const showSettingsOverview = matchesRoute(router.location.pathname, routes.accountSettings(props.account.id), true)

  const listItemTextStyle: React.CSSProperties = React.useMemo(
    () => ({
      paddingRight: isSmallScreen ? 0 : undefined
    }),
    [isSmallScreen]
  )

  return (
    <Carousel current={showSettingsOverview ? 0 : 1}>
      <List style={{ padding: isSmallScreen ? 0 : "24px 16px" }}>
        <AccountSettingsItem
          caret="right"
          icon={<KeyIcon style={{ fontSize: "100%" }} />}
          onClick={navigateTo.changePassword}
        >
          <ListItemText
            primary={
              props.account.requiresPassword
                ? t("account-settings.settings.set-password.text.primary.account-protected")
                : t("account-settings.settings.set-password.text.primary.account-not-protected")
            }
            secondary={
              props.account.requiresPassword
                ? t("account-settings.settings.set-password.text.secondary.account-protected")
                : t("account-settings.settings.set-password.text.secondary.account-not-protected")
            }
            style={listItemTextStyle}
          />
        </AccountSettingsItem>
        {settings.multiSignature ? (
          <AccountSettingsItem
            caret="right"
            disabled={accountData.balances.length === 0}
            icon={<GroupIcon style={{ fontSize: "100%" }} />}
            onClick={navigateTo.manageSigners}
          >
            <ListItemText
              primary={t("account-settings.settings.multi-sig.text.primary")}
              secondary={
                isSmallScreen
                  ? t("account-settings.settings.multi-sig.text.secondary.short")
                  : t("account-settings.settings.multi-sig.text.secondary.long")
              }
              style={listItemTextStyle}
            />
          </AccountSettingsItem>
        ) : null}
        <AccountSettingsItem
          caret="right"
          icon={<EyeIcon style={{ fontSize: "100%" }} />}
          onClick={navigateTo.exportSecretKey}
        >
          <ListItemText
            primary={t("account-settings.settings.export-secret-key.text.primary")}
            secondary={t("account-settings.settings.export-secret-key.text.secondary")}
            style={listItemTextStyle}
          />
        </AccountSettingsItem>
        <AccountSettingsItem
          caret="right"
          icon={<DeleteIcon style={{ fontSize: "100%" }} />}
          onClick={navigateTo.deleteAccount}
        >
          <ListItemText
            primary={t("account-settings.settings.delete-account.text.primary")}
            style={listItemTextStyle}
          />
        </AccountSettingsItem>
      </List>
      <SettingsDialogs account={props.account} />
    </Carousel>
  )
}

export default React.memo(AccountSettings)

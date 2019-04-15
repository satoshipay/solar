import React from "react"
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"
import Button from "@material-ui/core/Button"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Dialog from "@material-ui/core/Dialog"
import IconButton from "@material-ui/core/IconButton"
import Slide from "@material-ui/core/Slide"
import MoreVertIcon from "@material-ui/icons/MoreVert"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import { Account, AccountsContext, AccountsContextType } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useAccountData, useIsMobile, useRouter } from "../../hooks"
import * as routes from "../../routes"
import AccountDeletionDialog from "../Dialog/AccountDeletion"
import ChangePasswordDialog from "../Dialog/ChangePassword"
import ExportKeyDialog from "../Dialog/ExportKey"
import RenameDialog from "../Dialog/Rename"
import ButtonIconLabel from "../ButtonIconLabel"
import AccountContextMenu from "./AccountContextMenu"
import AccountTitle from "./AccountTitle"

enum DialogID {
  changePassword,
  deleteAccount,
  exportKey,
  renameAccount
}

const DialogTransition = (props: any) => <Slide {...props} direction="up" />
const DialogSidewaysTransition = (props: any) => <Slide {...props} direction="left" />

interface Props {
  account: Account
  children?: React.ReactNode
  onManageAssets: () => void
  onManageSigners: () => void
  onRenameAccount: AccountsContextType["renameAccount"]
  style?: React.CSSProperties
}

function AccountHeaderCard(props: Props) {
  const { changePassword, removePassword } = React.useContext(AccountsContext)
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const settings = React.useContext(SettingsContext)

  const [openDialog, setOpenDialog] = React.useState<DialogID | null>(null)
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const isWidthMax500 = useMediaQuery("(max-width:500px)")

  const closeDialog = React.useCallback(() => setOpenDialog(null), [setOpenDialog])
  const performRenaming = React.useCallback((newName: string) => props.onRenameAccount(props.account.id, newName), [
    props.account.id
  ])

  const actions = React.useMemo(
    () => (
      <>
        <Button
          onClick={() => router.history.push(routes.tradeAsset(props.account.id))}
          style={{
            borderColor: "rgba(255, 255, 255, 0.9)",
            color: "white",
            padding: "0 12px",
            marginRight: isSmallScreen ? 0 : 8,
            minHeight: 36
          }}
          variant="outlined"
        >
          <ButtonIconLabel label="Trade">
            <SwapHorizIcon />
          </ButtonIconLabel>
        </Button>

        <AccountContextMenu
          account={props.account}
          activated={accountData.activated}
          settings={settings}
          onChangePassword={() => setOpenDialog(DialogID.changePassword)}
          onDelete={() => setOpenDialog(DialogID.deleteAccount)}
          onExport={() => setOpenDialog(DialogID.exportKey)}
          onManageAssets={props.onManageAssets}
          onManageSigners={props.onManageSigners}
          onRename={() => setOpenDialog(DialogID.renameAccount)}
        >
          {({ onOpen }) => (
            <IconButton color="inherit" onClick={onOpen} style={{ marginRight: -16, fontSize: 32 }}>
              <MoreVertIcon style={{ fontSize: "inherit" }} />
            </IconButton>
          )}
        </AccountContextMenu>
      </>
    ),
    [props.account, accountData.activated, settings, props.onManageAssets, props.onManageSigners]
  )

  return (
    <Card
      style={{
        position: "relative",
        background: "transparent",
        boxShadow: "none",
        overflow: "visible",
        ...props.style
      }}
    >
      <CardContent style={isSmallScreen ? { padding: 8 } : undefined}>
        <AccountTitle account={props.account} accountData={accountData} actions={actions} />

        {props.children}

        <Dialog
          open={openDialog === DialogID.deleteAccount}
          onClose={closeDialog}
          TransitionComponent={DialogTransition}
        >
          <AccountDeletionDialog
            account={props.account}
            accountData={accountData}
            onClose={closeDialog}
            onDeleted={() => router.history.push(routes.allAccounts())}
          />
        </Dialog>
        <Dialog
          open={openDialog === DialogID.changePassword}
          onClose={closeDialog}
          PaperProps={{
            style: isWidthMax500
              ? { minWidth: 200, transition: "width 2s, min-width 2s" }
              : { minWidth: 500, transition: "width 2s, min-width 2s" }
          }}
          TransitionComponent={DialogTransition}
        >
          <ChangePasswordDialog
            account={props.account}
            changePassword={changePassword}
            onClose={closeDialog}
            removePassword={removePassword}
          />
        </Dialog>
        <Dialog
          fullScreen
          open={openDialog === DialogID.exportKey}
          onClose={closeDialog}
          TransitionComponent={DialogSidewaysTransition}
        >
          <ExportKeyDialog account={props.account} onClose={closeDialog} />
        </Dialog>
        <Dialog
          open={openDialog === DialogID.renameAccount}
          onClose={closeDialog}
          TransitionComponent={DialogTransition}
        >
          <RenameDialog
            onClose={closeDialog}
            performRenaming={performRenaming}
            prevValue={props.account.name}
            title="Rename account"
          />
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default AccountHeaderCard

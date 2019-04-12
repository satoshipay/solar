import React from "react"
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"
import Button from "@material-ui/core/Button"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Dialog from "@material-ui/core/Dialog"
import IconButton from "@material-ui/core/IconButton"
import Slide from "@material-ui/core/Slide"
import Tooltip from "@material-ui/core/Tooltip"
import GroupIcon from "@material-ui/icons/Group"
import MoreVertIcon from "@material-ui/icons/MoreVert"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account, AccountsContext, AccountsContextType } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useAccountData, useIsMobile, useRouter } from "../../hooks"
import * as routes from "../../routes"
import { primaryBackgroundColor } from "../../theme"
import AccountDeletionDialog from "../Dialog/AccountDeletion"
import ChangePasswordDialog from "../Dialog/ChangePassword"
import ExportKeyDialog from "../Dialog/ExportKey"
import RenameDialog from "../Dialog/Rename"
import ButtonIconLabel from "../ButtonIconLabel"
import { HorizontalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"
import AccountContextMenu from "./AccountContextMenu"

enum DialogID {
  changePassword,
  deleteAccount,
  exportKey,
  renameAccount
}

const DialogTransition = (props: any) => <Slide {...props} direction="up" />

function PasswordStatus(props: { safe: boolean; style?: React.CSSProperties }) {
  return (
    <Tooltip title={props.safe ? "Password protected" : "No password"}>
      <VerifiedUserIcon style={{ opacity: props.safe ? 1 : 0.5, ...props.style }} />
    </Tooltip>
  )
}

function TestnetBadge(props: { style?: React.CSSProperties }) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px",
    background: "white",
    borderRadius: 3,
    color: primaryBackgroundColor,
    fontSize: "50%",
    fontWeight: "bold",
    lineHeight: "100%",
    textTransform: "uppercase",
    ...props.style
  }
  return <span style={style}>Testnet</span>
}

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
  const settings = React.useContext(SettingsContext)
  const router = useRouter()

  const [openDialog, setOpenDialog] = React.useState<DialogID | null>(null)
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const isWidthMax500 = useMediaQuery("(max-width:500px)")

  const closeDialog = React.useCallback(() => setOpenDialog(null), [setOpenDialog])
  const performRenaming = React.useCallback((newName: string) => props.onRenameAccount(props.account.id, newName), [
    props.account.id
  ])

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
        <MainTitle
          title={<span style={{ marginRight: 20 }}>{props.account.name}</span>}
          titleColor="inherit"
          onBack={() => router.history.push(routes.allAccounts())}
          style={{ marginTop: -12, marginLeft: 0 }}
          badges={
            <HorizontalLayout display="inline-flex" alignItems="center" width="auto" fontSize="1.5rem">
              {props.account.testnet ? <TestnetBadge style={{ marginRight: 16 }} /> : null}
              {accountData.signers.length > 1 ? (
                <Tooltip title="Multi-Signature Account">
                  <GroupIcon style={{ fontSize: "120%", marginRight: 8 }} />
                </Tooltip>
              ) : null}
              <PasswordStatus safe={props.account.requiresPassword} style={{ fontSize: "90%", marginTop: "-0.05em" }} />
            </HorizontalLayout>
          }
          actions={
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
          }
        />

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
        <Dialog open={openDialog === DialogID.exportKey} onClose={closeDialog} TransitionComponent={DialogTransition}>
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

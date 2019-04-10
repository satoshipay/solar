import React from "react"
import Button from "@material-ui/core/Button"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Dialog from "@material-ui/core/Dialog"
import IconButton from "@material-ui/core/IconButton"
import Slide from "@material-ui/core/Slide"
import Tooltip from "@material-ui/core/Tooltip"
import Typography from "@material-ui/core/Typography"
import GroupIcon from "@material-ui/icons/Group"
import MoreVertIcon from "@material-ui/icons/MoreVert"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account, AccountsContext, AccountsContextType } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useAccountData, useRouter } from "../../hooks"
import * as routes from "../../routes"
import { primaryBackgroundColor } from "../../theme"
import BackButton from "../BackButton"
import ButtonIconLabel from "../ButtonIconLabel"
import AccountDeletionDialog from "../Dialog/AccountDeletion"
import ChangePasswordDialog from "../Dialog/ChangePassword"
import ExportKeyDialog from "../Dialog/ExportKey"
import RenameDialog from "../Dialog/Rename"
import { Box, HorizontalLayout } from "../Layout/Box"
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
  const settings = React.useContext(SettingsContext)
  const router = useRouter()

  const [openDialog, setOpenDialog] = React.useState<DialogID | null>(null)
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

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
        ...props.style
      }}
    >
      <CardContent>
        <HorizontalLayout alignItems="center" margin="-12px 0 -10px">
          <BackButton
            onClick={() => router.history.push(routes.allAccounts())}
            style={{ marginLeft: -10, marginRight: 10 }}
          />
          <Typography
            align="center"
            color="inherit"
            variant="h5"
            component="h2"
            style={{ marginRight: 20, fontSize: "2rem" }}
          >
            {props.account.name}
          </Typography>
          <HorizontalLayout display="inline-flex" alignItems="center" width="auto" fontSize="1.5rem">
            {props.account.testnet ? <TestnetBadge style={{ marginRight: 16 }} /> : null}
            {accountData.signers.length > 1 ? (
              <Tooltip title="Multi-Signature Account">
                <GroupIcon style={{ fontSize: "120%", marginRight: 8 }} />
              </Tooltip>
            ) : null}
            <PasswordStatus safe={props.account.requiresPassword} style={{ fontSize: "90%", marginTop: "-0.05em" }} />
          </HorizontalLayout>
          <Box grow style={{ textAlign: "right" }}>
            <Button
              color="secondary"
              disabled={!accountData.activated}
              onClick={() => router.history.push(routes.tradeAsset(props.account.id))}
              style={{ marginRight: 8 }}
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
                <IconButton color="inherit" onClick={onOpen} style={{ marginRight: -12, fontSize: 32 }}>
                  <MoreVertIcon style={{ fontSize: "inherit" }} />
                </IconButton>
              )}
            </AccountContextMenu>
          </Box>
        </HorizontalLayout>

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
          PaperProps={{ style: { minWidth: 500, transition: "width 2s, min-width 2s" } }}
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

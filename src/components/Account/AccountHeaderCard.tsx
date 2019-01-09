import React from "react"
import { useContext, useState } from "react"
import { withRouter, RouteComponentProps } from "react-router-dom"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import Tooltip from "@material-ui/core/Tooltip"
import Typography from "@material-ui/core/Typography"
import GroupIcon from "@material-ui/icons/Group"
import MoreVertIcon from "@material-ui/icons/MoreVert"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account, AccountsContext, AccountsContextType } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useAccountData } from "../../hooks"
import * as routes from "../../routes"
import { primaryBackgroundColor } from "../../theme"
import BackButton from "../BackButton"
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

interface Props extends RouteComponentProps<any, any, any> {
  account: Account
  children?: React.ReactNode
  onManageAssets: () => void
  onManageSigners: () => void
  onRenameAccount: AccountsContextType["renameAccount"]
  style?: React.CSSProperties
}

function AccountHeaderCard(props: Props) {
  const { changePassword, removePassword } = useContext(AccountsContext)
  const settings = useContext(SettingsContext)

  const [openDialog, setOpenDialog] = useState<DialogID | null>(null)
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

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
            onClick={() => props.history.push(routes.allAccounts())}
            style={{ marginLeft: -10, marginRight: 10 }}
          />
          <Typography
            align="center"
            color="inherit"
            variant="headline"
            component="h2"
            style={{ marginRight: 20, fontSize: "2rem" }}
          >
            {props.account.name}
          </Typography>
          <HorizontalLayout display="inline-flex" alignItems="center" width="auto" fontSize="1.5rem">
            {props.account.testnet ? <TestnetBadge style={{ marginRight: 16 }} /> : null}
            {accountData.signers.length > 1 ? (
              <Tooltip title="Multi-Signature Account">
                <GroupIcon style={{ marginRight: 8 }} />
              </Tooltip>
            ) : null}
            <PasswordStatus safe={props.account.requiresPassword} style={{ fontSize: "80%", marginTop: "-0.05em" }} />
          </HorizontalLayout>
          <Box grow style={{ textAlign: "right" }}>
            <AccountContextMenu
              account={props.account}
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

        <AccountDeletionDialog
          account={props.account}
          open={openDialog === DialogID.deleteAccount}
          onClose={() => setOpenDialog(null)}
          onDeleted={() => props.history.push(routes.allAccounts())}
        />
        <ChangePasswordDialog
          account={props.account}
          changePassword={changePassword}
          open={openDialog === DialogID.changePassword}
          onClose={() => setOpenDialog(null)}
          removePassword={removePassword}
        />
        <ExportKeyDialog
          account={props.account}
          open={openDialog === DialogID.exportKey}
          onClose={() => setOpenDialog(null)}
        />
        <RenameDialog
          open={openDialog === DialogID.renameAccount}
          onClose={() => setOpenDialog(null)}
          performRenaming={newName => props.onRenameAccount(props.account.id, newName)}
          prevValue={props.account.name}
          title="Rename account"
        />
      </CardContent>
    </Card>
  )
}

export default withRouter<Props>(AccountHeaderCard)

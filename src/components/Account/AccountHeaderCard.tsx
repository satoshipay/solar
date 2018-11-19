import React from "react"
import { withRouter, RouteComponentProps } from "react-router-dom"
import { History } from "history"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import Tooltip from "@material-ui/core/Tooltip"
import Typography from "@material-ui/core/Typography"
import ArrowBackIcon from "@material-ui/icons/ArrowBack"
import MoreVertIcon from "@material-ui/icons/MoreVert"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account, AccountsContext } from "../../context/accounts"
import { DialogsConsumer } from "../../context/dialogs"
import { DialogBlueprint, DialogType } from "../../context/dialogTypes"
import * as routes from "../../routes"
import { primaryBackgroundColor } from "../../theme"
import { Box, HorizontalLayout } from "../Layout/Box"
import AccountContextMenu from "./AccountContextMenu"

type BackButtonProps = RouteComponentProps<any, any, any> & {
  style?: React.CSSProperties
}

const BackButton = withRouter<BackButtonProps>((props: BackButtonProps) => {
  return (
    <IconButton color="inherit" onClick={() => props.history.push(routes.allAccounts())} style={props.style}>
      <ArrowBackIcon style={{ fontSize: "inherit" }} />
    </IconButton>
  )
})

const PasswordStatus = (props: { safe: boolean; style?: React.CSSProperties }) => {
  return (
    <Tooltip title={props.safe ? "Password protected" : "No password"}>
      <VerifiedUserIcon style={{ opacity: props.safe ? 1 : 0.5, ...props.style }} />
    </Tooltip>
  )
}

const TestnetBadge = (props: { style?: React.CSSProperties }) => {
  const style: React.CSSProperties = {
    display: "inline-block",
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
  history: History
  onManageAssets: () => void
  onRenameAccount: AccountsContext["renameAccount"]
  style?: React.CSSProperties
}

class AccountHeaderCard extends React.Component<Props & { openDialog: (dialog: DialogBlueprint) => void }> {
  onChangePassword = () => {
    this.props.openDialog({
      type: DialogType.ChangePassword,
      props: {
        account: this.props.account
      }
    })
  }

  onDelete = () => {
    this.props.openDialog({
      type: DialogType.DeleteAccount,
      props: {
        account: this.props.account,
        onDeleted: () => this.props.history.push(routes.allAccounts())
      }
    })
  }

  onExport = () => {
    this.props.openDialog({
      type: DialogType.ExportKey,
      props: {
        account: this.props.account
      }
    })
  }

  onManageSigners = () => {
    const route = routes.manageAccountSigners(this.props.account.id)
    this.props.history.push(route)
  }

  onRename = () => {
    const { account, openDialog, onRenameAccount } = this.props
    openDialog({
      type: DialogType.Rename,
      props: {
        performRenaming(newName: string) {
          return onRenameAccount(account.id, newName)
        },
        prevValue: account.name,
        title: "Rename account"
      }
    })
  }

  render() {
    return (
      <Card
        style={{
          position: "relative",
          background: "transparent",
          boxShadow: "none",
          ...this.props.style
        }}
      >
        <CardContent>
          <HorizontalLayout alignItems="center" margin="-12px 0 -10px">
            <BackButton style={{ marginLeft: -10, marginRight: 10, padding: 6, fontSize: 32 }} />
            <Typography
              align="center"
              color="inherit"
              variant="headline"
              component="h2"
              style={{ marginRight: 20, fontSize: "2rem" }}
            >
              {this.props.account.name}
            </Typography>
            <HorizontalLayout display="inline-flex" width="auto" fontSize="1.5rem">
              {this.props.account.testnet ? <TestnetBadge style={{ marginRight: 16 }} /> : null}
              <PasswordStatus safe={this.props.account.requiresPassword} style={{ fontSize: "80%" }} />
            </HorizontalLayout>
            <Box grow style={{ textAlign: "right" }}>
              <AccountContextMenu
                account={this.props.account}
                onChangePassword={this.onChangePassword}
                onDelete={this.onDelete}
                onExport={this.onExport}
                onManageAssets={this.props.onManageAssets}
                onManageSigners={this.onManageSigners}
                onRename={this.onRename}
              >
                {({ onOpen }) => (
                  <IconButton color="inherit" onClick={onOpen} style={{ marginRight: -12, fontSize: 32 }}>
                    <MoreVertIcon style={{ fontSize: "inherit" }} />
                  </IconButton>
                )}
              </AccountContextMenu>
            </Box>
          </HorizontalLayout>
          {this.props.children}
        </CardContent>
      </Card>
    )
  }
}

const AccountHeaderCardContainer = (props: Props) => {
  return (
    <DialogsConsumer>{({ openDialog }) => <AccountHeaderCard {...props} openDialog={openDialog} />}</DialogsConsumer>
  )
}

export default AccountHeaderCardContainer

import React from "react"
import { withRouter, RouteComponentProps } from "react-router-dom"
import { History } from "history"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import Tooltip from "@material-ui/core/Tooltip"
import Typography from "@material-ui/core/Typography"
import LockOpenIcon from "@material-ui/icons/LockOpen"
import ChevronLeftIcon from "react-icons/lib/md/chevron-left"
import { Account, AccountsContext } from "../../context/accounts"
import { DialogsConsumer } from "../../context/dialogs"
import { DialogBlueprint, DialogType } from "../../context/dialogTypes"
import * as routes from "../../routes"
import { Box, HorizontalLayout } from "../Layout/Box"
import AccountContextMenu from "./AccountContextMenu"

type BackButtonProps = RouteComponentProps<any, any, any> & {
  style?: React.CSSProperties
}

const BackButton = withRouter<BackButtonProps>((props: BackButtonProps) => {
  return (
    <IconButton color="inherit" onClick={() => props.history.push(routes.allAccounts())} style={props.style}>
      <ChevronLeftIcon />
    </IconButton>
  )
})

interface Props {
  account: Account
  children?: React.ReactNode
  history: History
  renameAccount: AccountsContext["renameAccount"]
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
    const { account, openDialog, renameAccount } = this.props
    openDialog({
      type: DialogType.Rename,
      props: {
        performRenaming(newName: string) {
          return renameAccount(account.id, newName)
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
          background: "inherit",
          boxShadow: "none",
          ...this.props.style
        }}
      >
        <CardContent>
          <HorizontalLayout alignItems="space-between">
            <Box grow>
              <BackButton style={{ marginTop: -8, marginLeft: -16, fontSize: 32 }} />
            </Box>
            <Typography align="center" color="inherit" variant="headline" component="h2" gutterBottom>
              {this.props.account.name}
              {this.props.account.requiresPassword ? null : (
                <Tooltip title="No password">
                  <LockOpenIcon style={{ marginLeft: 8, marginBottom: -2, fontSize: "70%" }} />
                </Tooltip>
              )}
            </Typography>
            <Box grow style={{ textAlign: "right" }}>
              <AccountContextMenu
                account={this.props.account}
                onChangePassword={this.onChangePassword}
                onDelete={this.onDelete}
                onExport={this.onExport}
                onManageSigners={this.onManageSigners}
                onRename={this.onRename}
                style={{ marginTop: -8, marginRight: -16, fontSize: 32 }}
              />
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

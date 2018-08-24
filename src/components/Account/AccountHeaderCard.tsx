import React from "react"
import { withRouter, RouteComponentProps } from "react-router-dom"
import { History } from "history"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import Typography from "@material-ui/core/Typography"
import ChevronLeftIcon from "react-icons/lib/md/chevron-left"
import * as routes from "../../routes"
import { Account, renameAccount } from "../../stores/accounts"
import { openDialog } from "../../stores/dialogs"
import {
  createAccountDeletionDialog,
  createExportKeyDialog,
  createChangeAccountPasswordDialog,
  createPaymentDialog,
  createRenamingDialog
} from "../Dialog/index"
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
  children: React.ReactNode
  history: History
  style?: React.CSSProperties
}

const AccountHeaderCard = (props: Props) => {
  const onChangePassword = () => {
    openDialog(createChangeAccountPasswordDialog(props.account))
  }
  const onDelete = () => {
    openDialog(createAccountDeletionDialog(props.account, () => props.history.push(routes.allAccounts())))
  }
  const onExport = () => {
    openDialog(createExportKeyDialog(props.account))
  }
  const onRename = () => {
    openDialog(
      createRenamingDialog("Rename account", props.account.name, (newName: string) =>
        renameAccount(props.account.id, newName)
      )
    )
  }

  return (
    <Card
      style={{
        position: "relative",
        background: "inherit",
        boxShadow: "none",
        ...props.style
      }}
    >
      <CardContent>
        <HorizontalLayout alignItems="space-between">
          <Box grow>
            <BackButton style={{ marginTop: -8, marginLeft: -16, fontSize: 32 }} />
          </Box>
          <Typography align="center" color="inherit" variant="headline" component="h2" gutterBottom>
            {props.account.name}
          </Typography>
          <Box grow style={{ textAlign: "right" }}>
            <AccountContextMenu
              account={props.account}
              onChangePassword={onChangePassword}
              onDelete={onDelete}
              onExport={onExport}
              onRename={onRename}
              style={{ marginTop: -8, marginRight: -16, fontSize: 32 }}
            />
          </Box>
        </HorizontalLayout>
        {props.children}
      </CardContent>
    </Card>
  )
}

export default AccountHeaderCard

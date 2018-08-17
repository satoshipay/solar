import React from "react"
import { History } from "history"
import { match } from "react-router"
import { withRouter, RouteComponentProps } from "react-router-dom"
import { observer } from "mobx-react"
import Button from "@material-ui/core/Button"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import IconButton from "@material-ui/core/IconButton"
import Typography from "@material-ui/core/Typography"
import indigo from "@material-ui/core/colors/indigo"
import ChevronLeftIcon from "react-icons/lib/md/chevron-left"
import SendIcon from "react-icons/lib/md/send"
import AccountDetails from "../components/AccountDetails"
import Spinner from "../components/Spinner"
import { Balance, Transactions } from "../components/Subscribers"
import TransactionList from "../components/TransactionList"
import { Box, HorizontalLayout } from "../components/Layout/Box"
import { VerticalMargin } from "../components/Layout/Spacing"
import { Section } from "../components/Layout/Page"
import AccountContextMenu from "../components/Menu/AccountContextMenu"
import {
  createAccountDeletionDialog,
  createExportKeyDialog,
  createChangeAccountPasswordDialog,
  createPaymentDialog,
  createRenamingDialog
} from "../components/Dialog/index"
import * as routes from "../lib/routes"
import AccountStore, { renameAccount } from "../stores/accounts"
import { openDialog } from "../stores/dialogs"

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

const AccountPage = (props: { accounts: typeof AccountStore; history: History; match: match<{ id: string }> }) => {
  const { params } = props.match
  const account = props.accounts.find(someAccount => someAccount.id === params.id)
  if (!account) {
    throw new Error(`Wallet account not found. ID: ${params.id}`)
  }

  const onChangePassword = () => {
    openDialog(createChangeAccountPasswordDialog(account))
  }
  const onDelete = () => {
    openDialog(createAccountDeletionDialog(account, () => props.history.push(routes.allAccounts())))
  }
  const onExport = () => {
    openDialog(createExportKeyDialog(account))
  }
  const onRename = () => {
    openDialog(
      createRenamingDialog("Rename account", account.name, (newName: string) => renameAccount(account.id, newName))
    )
  }

  return (
    <>
      <Section top backgroundColor={indigo[500]}>
        <Card
          style={{
            position: "relative",
            background: "inherit",
            boxShadow: "none",
            color: "white"
          }}
        >
          <CardContent>
            <HorizontalLayout alignItems="space-between">
              <Box grow>
                <BackButton style={{ marginTop: -8, marginLeft: -16, fontSize: 32 }} />
              </Box>
              <Typography align="center" color="inherit" variant="headline" component="h2" gutterBottom>
                {account.name}
              </Typography>
              <Box grow style={{ textAlign: "right" }}>
                <AccountContextMenu
                  account={account}
                  onChangePassword={onChangePassword}
                  onDelete={onDelete}
                  onExport={onExport}
                  onRename={onRename}
                  style={{ marginTop: -8, marginRight: -16, fontSize: 32 }}
                />
              </Box>
            </HorizontalLayout>
            <VerticalMargin size={28} />
            <AccountDetails account={account} />
            <Box margin="24px 0 0">
              <Balance publicKey={account.publicKey} testnet={account.testnet}>
                {(_, activated) => (
                  <Button
                    variant="contained"
                    color="default"
                    disabled={!activated}
                    onClick={() => openDialog(createPaymentDialog(account))}
                  >
                    <SendIcon style={{ marginRight: 8 }} />
                    Send payment
                  </Button>
                )}
              </Balance>
            </Box>
          </CardContent>
        </Card>
      </Section>
      <Section>
        <Transactions publicKey={account.publicKey} testnet={account.testnet}>
          {({ activated, loading, transactions }) =>
            loading ? (
              <Spinner />
            ) : activated ? (
              <TransactionList
                accountPublicKey={account.publicKey}
                title="Recent transactions"
                testnet={account.testnet}
                transactions={transactions}
              />
            ) : (
              <Typography align="center" color="textSecondary" style={{ margin: "30px auto" }}>
                Account does not exist on the network
              </Typography>
            )
          }
        </Transactions>
      </Section>
    </>
  )
}

export default observer(AccountPage)

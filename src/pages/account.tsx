import React from "react"
import { History } from "history"
import { match } from "react-router"
import { observer } from "mobx-react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import indigo from "@material-ui/core/colors/indigo"
import SendIcon from "react-icons/lib/md/send"
import AccountBottomNavigation from "../components/Account/AccountBottomNavigation"
import AccountDetails from "../components/Account/AccountDetails"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import BottomNavigationContainer from "../components/BottomNavigationContainer"
import Spinner from "../components/Spinner"
import { Balance, Transactions } from "../components/Subscribers"
import TransactionList from "../components/TransactionList"
import { Box } from "../components/Layout/Box"
import { VerticalMargin } from "../components/Layout/Spacing"
import { Section } from "../components/Layout/Page"
import * as routes from "../lib/routes"
import AccountStore, { renameAccount } from "../stores/accounts"
import { openDialog } from "../stores/dialogs"

const AccountPage = (props: { accounts: typeof AccountStore; history: History; match: match<{ id: string }> }) => {
  const { params } = props.match
  const account = props.accounts.find(someAccount => someAccount.id === params.id)
  if (!account) {
    throw new Error(`Wallet account not found. ID: ${params.id}`)
  }

  return (
    <BottomNavigationContainer navigation={<AccountBottomNavigation />}>
      <Section top backgroundColor={indigo[500]}>
        <AccountHeaderCard account={account} history={props.history} style={{ color: "white" }}>
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
        </AccountHeaderCard>
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
    </BottomNavigationContainer>
  )
}

export default observer(AccountPage)

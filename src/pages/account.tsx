import React from "react"
import { History } from "history"
import { match } from "react-router"
import { observer } from "mobx-react"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import SendIcon from "react-icons/lib/md/send"
import { createPaymentDialog } from "../components/Dialog/index"
import AccountBottomNavigation from "../components/Account/AccountBottomNavigation"
import AccountDetails from "../components/Account/AccountDetails"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import FriendbotButton from "../components/Account/FriendbotButton"
import TransactionList from "../components/Account/TransactionList"
import BottomNavigationContainer from "../components/BottomNavigationContainer"
import { MinimumAccountBalance } from "../components/Fetchers"
import { AccountData, Transactions } from "../components/Subscribers"
import { Box } from "../components/Layout/Box"
import { VerticalMargin } from "../components/Layout/Spacing"
import { Section } from "../components/Layout/Page"
import AccountStore from "../stores/accounts"
import { openDialog } from "../stores/dialogs"

const AccountPage = (props: { accounts: typeof AccountStore; history: History; match: match<{ id: string }> }) => {
  const { params } = props.match
  const account = props.accounts.find(someAccount => someAccount.id === params.id)
  if (!account) {
    throw new Error(`Wallet account not found. ID: ${params.id}`)
  }

  return (
    <BottomNavigationContainer navigation={<AccountBottomNavigation account={account} />}>
      <Section top brandColored>
        <AccountHeaderCard account={account} history={props.history}>
          <VerticalMargin size={28} />
          <AccountDetails account={account} />
          <Box margin="1.5rem 0 0">
            <AccountData publicKey={account.publicKey} testnet={account.testnet}>
              {(_, activated) => (
                <Button
                  variant="contained"
                  disabled={!activated}
                  onClick={() => openDialog(createPaymentDialog(account))}
                  style={{
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
                    paddingLeft: 20,
                    paddingRight: 20
                  }}
                >
                  <SendIcon style={{ marginTop: -2, marginRight: 8 }} />
                  Send
                </Button>
              )}
            </AccountData>
          </Box>
        </AccountHeaderCard>
      </Section>
      <Section>
        <Transactions publicKey={account.publicKey} testnet={account.testnet}>
          {({ activated, horizon, loading, transactions }) =>
            loading ? (
              <div style={{ padding: "16px", textAlign: "center" }}>
                <CircularProgress />
              </div>
            ) : activated ? (
              <TransactionList
                accountPublicKey={account.publicKey}
                title="Recent transactions"
                testnet={account.testnet}
                transactions={transactions}
              />
            ) : (
              <>
                <Typography align="center" color="textSecondary" style={{ margin: "30px auto" }}>
                  Account does not yet exist on the network. Send at least XLM&nbsp;
                  <MinimumAccountBalance testnet={account.testnet} /> to activate the account.
                </Typography>
                {account.testnet ? (
                  <Typography align="center" style={{ paddingBottom: 30 }}>
                    <FriendbotButton horizon={horizon} publicKey={account.publicKey} />
                  </Typography>
                ) : null}
              </>
            )
          }
        </Transactions>
      </Section>
    </BottomNavigationContainer>
  )
}

export default observer(AccountPage)

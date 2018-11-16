import React from "react"
import { History } from "history"
import { match } from "react-router"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import SendIcon from "@material-ui/icons/Send"
import UpdateIcon from "@material-ui/icons/Update"
import ButtonIconLabel from "../components/ButtonIconLabel"
import AccountBottomNavigation from "../components/Account/AccountBottomNavigation"
import AccountDetails from "../components/Account/AccountDetails"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import FriendbotButton from "../components/Account/FriendbotButton"
import { InteractiveSignatureRequestList } from "../components/Account/SignatureRequestList"
import TransactionList from "../components/Account/TransactionList"
import BottomNavigationContainer from "../components/BottomNavigationContainer"
import CreatePaymentDialog from "../components/Dialog/CreatePayment"
import { MinimumAccountBalance } from "../components/Fetchers"
import { AccountData, Transactions } from "../components/Subscribers"
import { Box } from "../components/Layout/Box"
import { VerticalMargin } from "../components/Layout/Spacing"
import { Section } from "../components/Layout/Page"
import { Account, AccountsConsumer, AccountsContext } from "../context/accounts"
import { SignatureDelegationConsumer } from "../context/signatureDelegation"
import { isMultisigEnabled } from "../feature-flags"
import { hasSigned } from "../lib/transaction"

const AccountActions = (props: { account: Account; onOpenPaymentDrawer: () => void }) => {
  return (
    <AccountData publicKey={props.account.publicKey} testnet={props.account.testnet}>
      {(_, activated) => (
        <Button
          variant="contained"
          disabled={!activated}
          onClick={props.onOpenPaymentDrawer}
          style={{
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
            paddingLeft: 20,
            paddingRight: 20
          }}
        >
          <ButtonIconLabel label="Send">
            <SendIcon style={{ fontSize: "125%" }} />
          </ButtonIconLabel>
        </Button>
      )}
    </AccountData>
  )
}

const PendingMultisigTransactions = (props: { account: Account }) => {
  return (
    <SignatureDelegationConsumer>
      {({ pendingSignatureRequests }) => (
        <>
          <InteractiveSignatureRequestList
            account={props.account}
            icon={<SendIcon />}
            signatureRequests={pendingSignatureRequests.filter(
              request =>
                request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
                !hasSigned(request.meta.transaction, props.account.publicKey)
            )}
            title="Transactions to co-sign"
          />
          <InteractiveSignatureRequestList
            account={props.account}
            icon={<UpdateIcon style={{ opacity: 0.5 }} />}
            signatureRequests={pendingSignatureRequests.filter(
              request =>
                request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
                hasSigned(request.meta.transaction, props.account.publicKey)
            )}
            title="Awaiting additional signatures"
          />
        </>
      )}
    </SignatureDelegationConsumer>
  )
}

interface Props {
  accounts: Account[]
  history: History
  isPaymentDrawerOpen: boolean
  match: match<{ id: string }>
  renameAccount: AccountsContext["renameAccount"]
  onClosePaymentDrawer: () => void
  onOpenPaymentDrawer: () => void
}

const AccountPage = (props: Props) => {
  const { params } = props.match

  const account = props.accounts.find(someAccount => someAccount.id === params.id)
  if (!account) {
    throw new Error(`Wallet account not found. ID: ${params.id}`)
  }

  return (
    <BottomNavigationContainer navigation={<AccountBottomNavigation account={account} />}>
      <Section top brandColored>
        <AccountHeaderCard account={account} history={props.history} renameAccount={props.renameAccount}>
          <VerticalMargin size={28} />
          <AccountDetails account={account} />
          <Box margin="28px 0 0">
            <AccountActions account={account} onOpenPaymentDrawer={props.onOpenPaymentDrawer} />
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
              <>
                {isMultisigEnabled() ? <PendingMultisigTransactions account={account} /> : null}
                <TransactionList
                  accountPublicKey={account.publicKey}
                  title="Recent transactions"
                  testnet={account.testnet}
                  transactions={transactions}
                />
              </>
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
      <CreatePaymentDialog account={account} open={props.isPaymentDrawerOpen} onClose={props.onClosePaymentDrawer} />
    </BottomNavigationContainer>
  )
}

interface State {
  isPaymentDrawerOpen: boolean
}

class AccountPageContainer extends React.Component<Pick<Props, "history" | "match">, State> {
  state: State = {
    isPaymentDrawerOpen: false
  }

  closePaymentDrawer = () => {
    this.setState({ isPaymentDrawerOpen: false })
  }

  openPaymentDrawer = () => {
    this.setState({ isPaymentDrawerOpen: true })
  }

  render() {
    return (
      <AccountsConsumer>
        {accountsContext => (
          <AccountPage
            {...this.props}
            {...accountsContext}
            isPaymentDrawerOpen={this.state.isPaymentDrawerOpen}
            onClosePaymentDrawer={this.closePaymentDrawer}
            onOpenPaymentDrawer={this.openPaymentDrawer}
          />
        )}
      </AccountsConsumer>
    )
  }
}

export default AccountPageContainer

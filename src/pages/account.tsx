import React from "react"
import { History } from "history"
import { match } from "react-router"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import SendIcon from "react-icons/lib/md/send"
import ButtonIconLabel from "../components/ButtonIconLabel"
import AccountBottomNavigation from "../components/Account/AccountBottomNavigation"
import AccountDetails from "../components/Account/AccountDetails"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import FriendbotButton from "../components/Account/FriendbotButton"
import { InteractiveSignatureRequestList } from "../components/Account/SignatureRequestList"
import { TransactionList } from "../components/Account/TransactionList"
import BottomNavigationContainer from "../components/BottomNavigationContainer"
import { MinimumAccountBalance } from "../components/Fetchers"
import { AccountData, Transactions } from "../components/Subscribers"
import { Box } from "../components/Layout/Box"
import { VerticalMargin } from "../components/Layout/Spacing"
import { Section } from "../components/Layout/Page"
import { Account, AccountsConsumer, AccountsContext } from "../context/accounts"
import { DialogsConsumer } from "../context/dialogs"
import { DialogBlueprint, DialogType } from "../context/dialogTypes"
import { SignatureDelegationConsumer } from "../context/signatureDelegation"
import { isMultisigEnabled } from "../feature-flags"

function createPaymentDialog(account: Account): DialogBlueprint {
  return {
    type: DialogType.CreatePayment,
    props: {
      account
    }
  }
}

const AccountActions = (props: { account: Account }) => {
  return (
    <DialogsConsumer>
      {({ openDialog }) => (
        <AccountData publicKey={props.account.publicKey} testnet={props.account.testnet}>
          {(_, activated) => (
            <Button
              variant="contained"
              disabled={!activated}
              onClick={() => openDialog(createPaymentDialog(props.account))}
              style={{
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
                paddingLeft: 20,
                paddingRight: 20
              }}
            >
              <ButtonIconLabel label="Send">
                <SendIcon />
              </ButtonIconLabel>
            </Button>
          )}
        </AccountData>
      )}
    </DialogsConsumer>
  )
}

interface Props {
  accounts: Account[]
  history: History
  match: match<{ id: string }>
  renameAccount: AccountsContext["renameAccount"]
}

const AccountPage = (props: Props) => {
  const { renameAccount } = props
  const { params } = props.match

  const account = props.accounts.find(someAccount => someAccount.id === params.id)
  if (!account) {
    throw new Error(`Wallet account not found. ID: ${params.id}`)
  }

  return (
    <BottomNavigationContainer navigation={<AccountBottomNavigation account={account} />}>
      <Section top brandColored>
        <AccountHeaderCard account={account} history={props.history} renameAccount={renameAccount}>
          <VerticalMargin size={28} />
          <AccountDetails account={account} />
          <Box margin="24px 0 0">
            <AccountActions account={account} />
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
                {isMultisigEnabled() ? (
                  <SignatureDelegationConsumer>
                    {({ pendingSignatureRequests }) => (
                      <InteractiveSignatureRequestList
                        account={account}
                        signatureRequests={pendingSignatureRequests.filter(request =>
                          request._embedded.signers.some(signer => signer.account_id === account.publicKey)
                        )}
                        title="Pending transactions to co-sign"
                      />
                    )}
                  </SignatureDelegationConsumer>
                ) : null}
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
    </BottomNavigationContainer>
  )
}

const AccountPageContainer = (props: Pick<Props, "history" | "match">) => {
  return <AccountsConsumer>{accountsContext => <AccountPage {...props} {...accountsContext} />}</AccountsConsumer>
}

export default AccountPageContainer

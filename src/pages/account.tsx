import React from "react"
import { useContext, useState } from "react"
import { History } from "history"
import { match } from "react-router"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import DoneAllIcon from "@material-ui/icons/DoneAll"
import SendIcon from "@material-ui/icons/Send"
import UpdateIcon from "@material-ui/icons/Update"
import ButtonIconLabel from "../components/ButtonIconLabel"
import AccountDetails from "../components/Account/AccountDetails"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import FriendbotButton from "../components/Account/FriendbotButton"
import { InteractiveSignatureRequestList } from "../components/Account/SignatureRequestList"
import TransactionList from "../components/Account/TransactionList"
import CreatePaymentDialog from "../components/Dialog/CreatePayment"
import ManageAssetsDialog from "../components/Dialog/ManageAssets"
import ManageSignersDialog from "../components/Dialog/ManageSigners"
import { MinimumAccountBalance } from "../components/Fetchers"
import { Box } from "../components/Layout/Box"
import { VerticalMargin } from "../components/Layout/Spacing"
import { Section } from "../components/Layout/Page"
import { Account, AccountsContext } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import { SignatureDelegationContext } from "../context/signatureDelegation"
import { useAccountData, useHorizon, useRecentTransactions } from "../hooks"
import { hasSigned } from "../lib/transaction"

function AccountActions(props: { account: Account; onOpenPaymentDrawer: () => void }) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  return (
    <Button
      variant="contained"
      disabled={!accountData.activated}
      onClick={props.onOpenPaymentDrawer}
      style={{
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
        fontSize: "1rem",
        paddingLeft: 20,
        paddingRight: 20
      }}
    >
      <ButtonIconLabel label="Send">
        <SendIcon style={{ fontSize: "110%" }} />
      </ButtonIconLabel>
    </Button>
  )
}

function PendingMultisigTransactions(props: { account: Account }) {
  const { pendingSignatureRequests } = useContext(SignatureDelegationContext)
  return (
    <>
      <InteractiveSignatureRequestList
        account={props.account}
        icon={<DoneAllIcon />}
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
  )
}

function Transactions(props: { account: Account }) {
  const { account } = props
  const horizon = useHorizon(account.testnet)
  const recentTxs = useRecentTransactions(account.publicKey, account.testnet)
  const settings = useContext(SettingsContext)

  return (
    <>
      {recentTxs.loading ? (
        <div style={{ padding: "16px", textAlign: "center" }}>
          <CircularProgress />
        </div>
      ) : recentTxs.activated ? (
        <>
          {settings.multiSignature ? <PendingMultisigTransactions account={account} /> : null}
          <TransactionList
            accountPublicKey={account.publicKey}
            background="transparent"
            title="Recent transactions"
            testnet={account.testnet}
            transactions={recentTxs.transactions}
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
      )}
    </>
  )
}

interface Props {
  history: History
  match: match<{ id: string }>
}

function AccountPage(props: Props) {
  const { params } = props.match

  const { accounts, renameAccount } = useContext(AccountsContext)
  const [isAssetsDrawerOpen, setAssetsDrawerOpen] = useState(false)
  const [isPaymentDrawerOpen, setPaymentDrawerOpen] = useState(false)
  const [isSignersDrawerOpen, setSignersDrawerOpen] = useState(false)

  const account = accounts.find(someAccount => someAccount.id === params.id)
  if (!account) {
    throw new Error(`Wallet account not found. ID: ${params.id}`)
  }

  return (
    <>
      <Section top brandColored>
        <AccountHeaderCard
          account={account}
          onManageAssets={() => setAssetsDrawerOpen(true)}
          onManageSigners={() => setSignersDrawerOpen(true)}
          onRenameAccount={renameAccount}
        >
          <VerticalMargin size={28} />
          <AccountDetails account={account} />
          <Box margin="24px 0 0">
            <AccountActions account={account} onOpenPaymentDrawer={() => setPaymentDrawerOpen(true)} />
          </Box>
        </AccountHeaderCard>
      </Section>
      <Section backgroundColor="#f6f6f6">
        <Transactions account={account} />
      </Section>
      <CreatePaymentDialog account={account} open={isPaymentDrawerOpen} onClose={() => setPaymentDrawerOpen(false)} />
      <ManageAssetsDialog account={account} open={isAssetsDrawerOpen} onClose={() => setAssetsDrawerOpen(false)} />
      <ManageSignersDialog account={account} open={isSignersDrawerOpen} onClose={() => setSignersDrawerOpen(false)} />
    </>
  )
}

export default AccountPage

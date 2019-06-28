import React from "react"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import DoneAllIcon from "@material-ui/icons/DoneAll"
import UpdateIcon from "@material-ui/icons/Update"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { SignatureDelegationContext } from "../../context/signatureDelegation"
import { useHorizon, useRecentTransactions } from "../../hooks"
import { hasSigned } from "../../lib/transaction"
import { MinimumAccountBalance } from "../Fetchers"
import { HorizontalLayout } from "../Layout/Box"
import FriendbotButton from "./FriendbotButton"
import OfferList from "./OfferList"
import { InteractiveSignatureRequestList } from "./SignatureRequestList"
import TransactionList from "./TransactionList"

function PendingMultisigTransactions(props: { account: Account }) {
  const { pendingSignatureRequests } = React.useContext(SignatureDelegationContext)

  const cosignIcon = React.useMemo(() => <DoneAllIcon />, [])
  const waitingIcon = React.useMemo(() => <UpdateIcon style={{ opacity: 0.5 }} />, [])

  const pendingRequestsToCosign = React.useMemo(
    () => {
      return pendingSignatureRequests.filter(
        request =>
          request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
          !hasSigned(request.meta.transaction, props.account.publicKey)
      )
    },
    [props.account, pendingSignatureRequests]
  )

  const pendingRequestsWaitingForOthers = React.useMemo(
    () => {
      return pendingSignatureRequests.filter(
        request =>
          request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
          hasSigned(request.meta.transaction, props.account.publicKey)
      )
    },
    [props.account, pendingSignatureRequests]
  )

  return (
    <>
      <InteractiveSignatureRequestList
        account={props.account}
        icon={cosignIcon}
        signatureRequests={pendingRequestsToCosign}
        title="Transactions to co-sign"
      />
      <InteractiveSignatureRequestList
        account={props.account}
        icon={waitingIcon}
        signatureRequests={pendingRequestsWaitingForOthers}
        title="Awaiting additional signatures"
      />
    </>
  )
}

function AccountTransactions(props: { account: Account }) {
  const { account } = props
  const horizon = useHorizon(account.testnet)
  const recentTxs = useRecentTransactions(account.publicKey, account.testnet)
  const settings = React.useContext(SettingsContext)

  return (
    <>
      {recentTxs.loading ? (
        <HorizontalLayout alignItems="center" justifyContent="center" height="100%" padding={16} width="100%">
          <CircularProgress />
        </HorizontalLayout>
      ) : recentTxs.activated ? (
        <>
          {settings.multiSignature ? <PendingMultisigTransactions account={account} /> : null}
          <OfferList account={account} title="Open offers" />
          <TransactionList
            account={account}
            background="transparent"
            title="Recent transactions"
            testnet={account.testnet}
            transactions={recentTxs.transactions}
          />
        </>
      ) : (
        <>
          <Typography align="center" color="textSecondary" style={{ margin: "30px auto" }}>
            Account does not yet exist on the network. Send at least <MinimumAccountBalance testnet={account.testnet} />
            &nbsp;XLM to activate the account.
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

export default AccountTransactions

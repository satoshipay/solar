import React from "react"
import Typography from "@material-ui/core/Typography"
import DoneAllIcon from "@material-ui/icons/DoneAll"
import UpdateIcon from "@material-ui/icons/Update"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { SignatureDelegationContext } from "../../context/signatureDelegation"
import { useLiveRecentTransactions } from "../../hooks/stellar-subscriptions"
import { hasSigned } from "../../lib/transaction"
import { MinimumAccountBalance } from "../Fetchers"
import OfferList from "./OfferList"
import { InteractiveSignatureRequestList } from "./SignatureRequestList"
import LumenDepositOptions from "./LumenDepositOptions"
import TransactionList from "./TransactionList"
import TransactionListPlaceholder from "./TransactionListPlaceholder"

function PendingMultisigTransactions(props: { account: Account }) {
  const { pendingSignatureRequests } = React.useContext(SignatureDelegationContext)

  const cosignIcon = React.useMemo(() => <DoneAllIcon />, [])
  const waitingIcon = React.useMemo(() => <UpdateIcon style={{ opacity: 0.5 }} />, [])

  const pendingRequestsToCosign = React.useMemo(() => {
    return pendingSignatureRequests.filter(
      request =>
        request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
        !hasSigned(request.meta.transaction, props.account.publicKey)
    )
  }, [props.account, pendingSignatureRequests])

  const pendingRequestsWaitingForOthers = React.useMemo(() => {
    return pendingSignatureRequests.filter(
      request =>
        request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
        hasSigned(request.meta.transaction, props.account.publicKey)
    )
  }, [props.account, pendingSignatureRequests])

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
  const recentTxs = useLiveRecentTransactions(account.publicKey, account.testnet)
  const settings = React.useContext(SettingsContext)

  return (
    <>
      {recentTxs.loading ? (
        <TransactionListPlaceholder />
      ) : recentTxs.activated ? (
        <>
          {settings.multiSignature ? <PendingMultisigTransactions account={account} /> : null}
          <OfferList account={account} title="Open orders" />
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
          <Typography align="center" color="textSecondary" style={{ margin: "30px auto", padding: "0 16px" }}>
            Account not found on the network.
            <br />
            Fund it with at least <MinimumAccountBalance testnet={props.account.testnet} />
            &nbsp;XLM.
          </Typography>
          <LumenDepositOptions account={account} />
        </>
      )}
    </>
  )
}

export default AccountTransactions

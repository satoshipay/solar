import React from "react"
import DoneAllIcon from "@material-ui/icons/DoneAll"
import CreditCardIcon from "@material-ui/icons/CreditCard"
import UpdateIcon from "@material-ui/icons/Update"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { SignatureDelegationContext } from "../../context/signatureDelegation"
import { hasSigned } from "../../lib/transaction"
import { useHorizonURL } from "../../hooks/stellar"
import { useLiveRecentTransactions, useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { useRouter } from "../../hooks/userinterface"
import * as routes from "../../routes"
import MainSelectionButton from "../Form/MainSelectionButton"
import { VerticalLayout } from "../Layout/Box"
import FriendbotButton from "./FriendbotButton"
import OfferList from "./OfferList"
import { InteractiveSignatureRequestList } from "./SignatureRequestList"
import TransactionList from "./TransactionList"

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
  const horizonURL = useHorizonURL(account.testnet)
  const accountData = useLiveAccountData(account.publicKey, account.testnet)
  const recentTxs = useLiveRecentTransactions(account.publicKey, account.testnet)
  const router = useRouter()
  const settings = React.useContext(SettingsContext)

  const navigateToDeposit = React.useCallback(() => router.history.push(routes.depositAsset(account.id)), [
    account,
    router
  ])

  return (
    <>
      {accountData.balances.length > 0 ? (
        <>
          {settings.multiSignature ? <PendingMultisigTransactions account={account} /> : null}
          <OfferList account={account} title="Open orders" />
          <TransactionList
            account={account}
            background="transparent"
            title="Recent transactions"
            testnet={account.testnet}
            transactions={recentTxs}
          />
        </>
      ) : (
        <>
          <VerticalLayout
            alignItems="stretch"
            margin="32px auto"
            style={{ padding: "0 28px 30px", width: "fit-content" }}
          >
            {account.testnet ? (
              <FriendbotButton horizonURL={horizonURL} publicKey={account.publicKey} />
            ) : null}
            <MainSelectionButton
              Icon={CreditCardIcon}
              description="Via credit card, bank transfer, etc."
              label="Deposit funds"
              onClick={navigateToDeposit}
            />
          </VerticalLayout>
        </>
      )}
    </>
  )
}

export default React.memo(AccountTransactions)

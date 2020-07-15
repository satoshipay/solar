import ListSubheader from "@material-ui/core/ListSubheader"
import { TransactionStellarUri } from "@stellarguard/stellar-uri"
import React from "react"
import { Transaction } from "stellar-sdk"
import { useRouter } from "~Generic/hooks/userinterface"
import { matchesRoute } from "~Generic/lib/routes"
import * as routes from "~App/routes"
import { Account } from "~App/contexts/accounts"
import { InlineErrorBoundary } from "~Generic/components/ErrorBoundaries"
import { MultisigTransactionResponse } from "~Generic/lib/multisig-service"
import { List } from "~Layout/components/List"
import { TransactionListItem } from "./TransactionList"
import TransactionSender from "~Transaction/components/TransactionSender"

interface SignatureRequestListItemProps {
  icon?: React.ReactElement<any>
  onOpenTransaction?: (tx: Transaction, signatureRequest: MultisigTransactionResponse) => void
  signatureRequest: MultisigTransactionResponse
  style?: React.CSSProperties
  testnet: boolean
}

function SignatureRequestListItem(props: SignatureRequestListItemProps) {
  const { onOpenTransaction, signatureRequest } = props

  const tx = React.useMemo(() => new TransactionStellarUri(signatureRequest.req).getTransaction(), [
    signatureRequest.req
  ])

  const envelopeXdr = React.useMemo(() => tx.toEnvelope().toXDR("base64"), [tx])

  const openTransaction = React.useCallback(
    onOpenTransaction ? () => onOpenTransaction(tx, signatureRequest) : () => undefined,
    [onOpenTransaction, signatureRequest, tx]
  )

  return (
    <TransactionListItem
      alwaysShowSource
      accountPublicKey={tx.source}
      createdAt={signatureRequest.created_at}
      icon={props.icon}
      onOpenTransaction={openTransaction}
      style={props.style}
      testnet={props.testnet}
      transactionEnvelopeXdr={envelopeXdr}
    />
  )
}

interface SignatureRequestListProps {
  account: Account
  icon?: React.ReactElement<any>
  sendTransaction: (transaction: Transaction, signatureRequest: MultisigTransactionResponse) => void
  signatureRequests: MultisigTransactionResponse[]
  title: React.ReactNode
}

// tslint:disable-next-line no-shadowed-variable
export const SignatureRequestList = React.memo(function SignatureRequestList(props: SignatureRequestListProps) {
  const { sendTransaction } = props
  const router = useRouter()

  React.useEffect(() => {
    const handleNavigation = (pathname: string) => {
      if (matchesRoute(pathname, routes.showTransaction("*", "*"))) {
        const [, , , hash] = pathname.replace(/^\//, "").split("/")
        const signatureRequest = props.signatureRequests.find(sr => sr.hash === hash)

        if (signatureRequest) {
          const stellarUri = new TransactionStellarUri(signatureRequest.req)
          sendTransaction(stellarUri.getTransaction(), signatureRequest)
        }
      }
    }

    handleNavigation(router.location.pathname)

    const unsubscribe = router.history.listen(location => {
      handleNavigation(location.pathname)
    })
    return unsubscribe
  }, [router.history, router.location.pathname, sendTransaction, props.signatureRequests])

  const openSignatureRequest = (tx: Transaction, signatureRequest: MultisigTransactionResponse) => {
    router.history.push(routes.showTransaction(props.account.id, signatureRequest.hash))
  }

  if (props.signatureRequests.length === 0) {
    return null
  }
  return (
    <>
      <List style={{ background: "transparent" }}>
        <ListSubheader disableSticky style={{ background: "transparent" }}>
          {props.title}
        </ListSubheader>
        {props.signatureRequests.map(signatureRequest => (
          <InlineErrorBoundary height={72} key={signatureRequest.hash}>
            <SignatureRequestListItem
              icon={props.icon}
              onOpenTransaction={openSignatureRequest}
              signatureRequest={signatureRequest}
              style={{
                minHeight: 72
              }}
              testnet={props.account.testnet}
            />
          </InlineErrorBoundary>
        ))}
      </List>
    </>
  )
})

export const InteractiveSignatureRequestList = React.memo(
  (props: {
    account: Account
    icon?: React.ReactElement<any>
    signatureRequests: MultisigTransactionResponse[]
    title: React.ReactNode
  }) => {
    const router = useRouter()
    const forceClose = !matchesRoute(router.location.pathname, routes.showTransaction("*", "*"))

    const onCloseDialog = React.useCallback(() => {
      router.history.push(routes.routeUp(router.location.pathname))
    }, [router])

    if (props.signatureRequests.length === 0) {
      return null
    }
    return (
      <TransactionSender account={props.account} forceClose={forceClose} onCloseTransactionDialog={onCloseDialog}>
        {({ sendTransaction }) => (
          <SignatureRequestList
            account={props.account}
            icon={props.icon}
            sendTransaction={sendTransaction}
            signatureRequests={props.signatureRequests}
            title={props.title}
          />
        )}
      </TransactionSender>
    )
  }
)

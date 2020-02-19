import React from "react"
import { Transaction } from "stellar-sdk"
import ListSubheader from "@material-ui/core/ListSubheader"
import { useRouter } from "../../hooks/userinterface"
import { matchesRoute } from "../../lib/routes"
import * as routes from "../../routes"
import { Account } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import { List } from "../List"
import { TransactionListItem } from "./TransactionList"
import TransactionSender from "../TransactionSender"

interface SignatureRequestListItemProps {
  icon?: React.ReactElement<any>
  onOpenTransaction?: (tx: Transaction, signatureRequest: SignatureRequest) => void
  signatureRequest: SignatureRequest
  style?: React.CSSProperties
  testnet: boolean
}

function SignatureRequestListItem(props: SignatureRequestListItemProps) {
  const { onOpenTransaction, signatureRequest } = props

  const envelopeXdr = React.useMemo(
    () =>
      signatureRequest.meta.transaction
        .toEnvelope()
        .toXDR()
        .toString("base64"),
    [signatureRequest.meta.transaction]
  )

  const openTransaction = React.useCallback(
    onOpenTransaction ? () => onOpenTransaction(signatureRequest.meta.transaction, signatureRequest) : () => undefined,
    [onOpenTransaction, signatureRequest]
  )

  return (
    <TransactionListItem
      alwaysShowSource
      accountPublicKey={signatureRequest.meta.transaction.source}
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
  sendTransaction: (transaction: Transaction, signatureRequest: SignatureRequest) => void
  signatureRequests: SignatureRequest[]
  title: React.ReactNode
}

// tslint:disable-next-line no-shadowed-variable
export const SignatureRequestList = React.memo(function SignatureRequestList(props: SignatureRequestListProps) {
  const router = useRouter()

  const handleNavigation = (pathname: string) => {
    if (matchesRoute(pathname, routes.showTransaction("*", "*"))) {
      const [, , , hash] = pathname.replace(/^\//, "").split("/")
      const signatureRequest = props.signatureRequests.find(sr => sr.hash === hash)

      if (signatureRequest) {
        props.sendTransaction(signatureRequest.meta.transaction, signatureRequest)
      }
    }
  }

  React.useEffect(() => {
    handleNavigation(router.location.pathname)

    const unsubscribe = router.history.listen(location => {
      handleNavigation(location.pathname)
    })
    return unsubscribe
  }, [handleNavigation, router.history, router.location.pathname])

  const openSignatureRequest = (tx: Transaction, signatureRequest: SignatureRequest) => {
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
          <SignatureRequestListItem
            key={signatureRequest.hash}
            icon={props.icon}
            onOpenTransaction={openSignatureRequest}
            signatureRequest={signatureRequest}
            style={{
              minHeight: 72
            }}
            testnet={props.account.testnet}
          />
        ))}
      </List>
    </>
  )
})

export const InteractiveSignatureRequestList = React.memo(
  (props: {
    account: Account
    icon?: React.ReactElement<any>
    signatureRequests: SignatureRequest[]
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

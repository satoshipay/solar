import React from "react"
import { Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import ListSubheader from "@material-ui/core/ListSubheader"
import Typography from "@material-ui/core/Typography"
import ArrowForwardIcon from "@material-ui/icons/ArrowForward"
import CloseIcon from "@material-ui/icons/Close"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { SignatureRequest } from "../../lib/multisig-service"
import { List } from "../List"
import { TransactionListItem } from "./TransactionList"
import { ActionButton, ConfirmDialog } from "../Dialog/Generic"
import TransactionSender from "../TransactionSender"

interface SignatureRequestListItemProps {
  accountPublicKey: string
  icon?: React.ReactElement<any>
  onDismissSignatureRequest: (hash: string) => void
  onOpenTransaction?: (tx: Transaction, signatureRequest: SignatureRequest) => void
  signatureRequest: SignatureRequest
  style?: React.CSSProperties
}

function SignatureRequestListItem(props: SignatureRequestListItemProps) {
  const { onDismissSignatureRequest, onOpenTransaction, signatureRequest } = props
  const onDismiss = onDismissSignatureRequest ? () => onDismissSignatureRequest(signatureRequest.hash) : undefined
  const onOpen = onOpenTransaction
    ? () => onOpenTransaction(signatureRequest.meta.transaction, signatureRequest)
    : undefined
  return (
    <TransactionListItem
      alwaysShowSource
      accountPublicKey={signatureRequest.meta.transaction.source}
      createdAt={signatureRequest.created_at}
      icon={props.icon}
      hoverActions={
        <Typography component="div" color="textPrimary" style={{ display: "inline-flex", alignItems: "stretch" }}>
          <Button onClick={onDismiss} color="inherit" variant="contained">
            Dismiss&nbsp;
            <CloseIcon style={{ fontSize: "140%" }} />
          </Button>
          <span style={{ display: "inline-block", width: 16 }} />
          <Button onClick={onOpen} color="primary" variant="contained">
            Review&nbsp;
            <ArrowForwardIcon style={{ fontSize: "140%" }} />
          </Button>
        </Typography>
      }
      style={props.style}
      transaction={signatureRequest.meta.transaction}
    />
  )
}

interface SignatureRequestListProps {
  accountPublicKey: string
  icon?: React.ReactElement<any>
  onOpenTransaction?: (transaction: Transaction, signatureRequest: SignatureRequest) => void
  signatureRequests: SignatureRequest[]
  title: React.ReactNode
}

export function SignatureRequestList(props: SignatureRequestListProps) {
  const settings = React.useContext(SettingsContext)
  const [pendingConfirmation, setPendingConfirmation] = React.useState<SignatureRequest | null>(null)

  const onConfirmDismissal = () => {
    if (!pendingConfirmation) return

    settings.ignoreSignatureRequest(pendingConfirmation.hash)
    setPendingConfirmation(null)
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
            accountPublicKey={props.accountPublicKey}
            icon={props.icon}
            onDismissSignatureRequest={() => setPendingConfirmation(signatureRequest)}
            onOpenTransaction={props.onOpenTransaction}
            signatureRequest={signatureRequest}
            style={{
              background: "#ffffff",
              boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
              minHeight: 72
            }}
          />
        ))}
      </List>
      <ConfirmDialog
        cancelButton={<ActionButton onClick={() => setPendingConfirmation(null)}>Cancel</ActionButton>}
        confirmButton={
          <ActionButton onClick={onConfirmDismissal} type="primary">
            Confirm
          </ActionButton>
        }
        onClose={() => setPendingConfirmation(null)}
        open={pendingConfirmation !== null}
        title="Confirm"
      >
        Dismiss pending multi-signature transaction?
      </ConfirmDialog>
    </>
  )
}

export const InteractiveSignatureRequestList = React.memo(
  (props: {
    account: Account
    icon?: React.ReactElement<any>
    signatureRequests: SignatureRequest[]
    title: React.ReactNode
  }) => {
    if (props.signatureRequests.length === 0) {
      return null
    }
    return (
      <TransactionSender account={props.account}>
        {({ sendTransaction }) => (
          <SignatureRequestList
            accountPublicKey={props.account.publicKey}
            icon={props.icon}
            onOpenTransaction={sendTransaction}
            signatureRequests={props.signatureRequests}
            title={props.title}
          />
        )}
      </TransactionSender>
    )
  }
)

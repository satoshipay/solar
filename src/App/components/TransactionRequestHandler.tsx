import React from "react"
import { Transaction, Networks } from "stellar-sdk"
import { Dialog } from "@material-ui/core"
import { StellarUriType, StellarUri, TransactionStellarUri } from "@stellarguard/stellar-uri"
import DialogBody from "~Layout/components/DialogBody"
import MainTitle from "~Generic/components/MainTitle"
import TransactionSummary from "~TransactionReview/components/TransactionSummary"
import { FullscreenDialogTransition } from "../theme"
import { TransactionRequestContext } from "../contexts/transactionRequest"

const Transition = FullscreenDialogTransition

function DefaultDialog(props: { onClose: () => void; testnet: boolean; transaction: Transaction }) {
  return (
    <DialogBody top={<MainTitle title="Received transaction" onBack={props.onClose} />}>
      <TransactionSummary account={null} canSubmit={false} testnet={props.testnet} transaction={props.transaction} />
    </DialogBody>
  )
}

function TransactionRequestHandler() {
  const { uri, clearURI } = React.useContext(TransactionRequestContext)
  const [closedStellarURI, setClosedStellarURI] = React.useState<StellarUri | null>(null)

  // We need that so we still know what to render when we fade out the dialog
  const renderedURI = uri || closedStellarURI

  const closeDialog = React.useCallback(() => {
    setClosedStellarURI(uri)
    clearURI()
  }, [clearURI, uri])

  if (renderedURI && renderedURI.operation === StellarUriType.Transaction) {
    const testnet = renderedURI.isTestNetwork
    const networkPassphrase = testnet ? Networks.TESTNET : Networks.PUBLIC
    const transaction = new Transaction((renderedURI as TransactionStellarUri).xdr, networkPassphrase)

    // TODO return different dialog depending on renderedURI
    return (
      <Dialog open={Boolean(uri)} fullScreen TransitionComponent={Transition}>
        <DefaultDialog onClose={closeDialog} testnet={testnet} transaction={transaction} />
      </Dialog>
    )
  }
  return null
}

export default React.memo(TransactionRequestHandler)

/*
 * We need to put this wrapper component in a module of its own and lazy-load the
 * actual dialog from here, so that we can show a loading animation in the
 * <TransferDialogLayout>.
 *
 * This is necessary since the TransferDialog bundle is pretty large and takes a
 * relatively long time to be parsed on older mobile devices.
 */

import React from "react"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import TransactionSender from "../TransactionSender"
import ViewLoading from "../ViewLoading"
import { TransferDialogProps } from "./TransferDialog"
import TransferDialogLayout from "./TransferDialogLayout"

const TransferDialog = React.lazy(() => import("./TransferDialog"))

function ConnectedTransferDialog(props: Pick<TransferDialogProps, "account" | "onClose" | "type">) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)

  return (
    <TransactionSender account={props.account}>
      {({ horizon, sendTransaction }) => (
        <React.Suspense
          fallback={
            <TransferDialogLayout
              account={props.account}
              dialogActionsRef={undefined}
              onNavigateBack={props.onClose}
              type={props.type}
            >
              <ViewLoading height={300} />
            </TransferDialogLayout>
          }
        >
          <TransferDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
        </React.Suspense>
      )}
    </TransactionSender>
  )
}

export default React.memo(ConnectedTransferDialog)

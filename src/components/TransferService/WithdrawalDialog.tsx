import React from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { useTransferInfos } from "../../hooks/transfer-server"
import { useDialogActions } from "../../hooks/userinterface"
import { AccountData } from "../../lib/account"
import { getAssetsFromBalances } from "../../lib/stellar"
import VirtualizedCarousel from "../Layout/VirtualizedCarousel"
import TransactionSender from "../TransactionSender"
import ViewLoading from "../ViewLoading"
import NoWithdrawableAssets from "./NoWithdrawableAssets"
import WithdrawalProvider from "./WithdrawalProvider"
import { useWithdrawalState } from "./useWithdrawalState"
import WithdrawalContent from "./WithdrawalContent"
import WithdrawalDialogLayout from "./WithdrawalDialogLayout"

function flatMap<In, Out>(inputs: In[], mapper: (input: In) => Out[]): Out[] {
  return inputs.reduce<Out[]>((outputs, input): Out[] => [...outputs, ...mapper(input)], [])
}

interface Props {
  account: Account
  accountData: AccountData
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction) => Promise<any>
}

const WithdrawalDialog = React.memo(function WithdrawalDialog(props: Props) {
  const dialogActionsRef = useDialogActions()
  const { actions, nextState, prevStates, state } = useWithdrawalState(props.account, props.onClose)

  const prevState = prevStates.length > 0 ? prevStates[prevStates.length - 1] : undefined

  const trustedAssets = React.useMemo(() => getAssetsFromBalances(props.accountData.balances) || [Asset.native()], [
    props.accountData.balances
  ])

  const transferInfos = useTransferInfos(trustedAssets, props.account.testnet)

  const assetTransferInfos = React.useMemo(
    () => flatMap(transferInfos, transferInfo => (transferInfo ? transferInfo.assets : [])),
    [transferInfos]
  )

  const withdrawableAssets = React.useMemo(() => {
    return assetTransferInfos
      .filter(assetInfo => assetInfo.withdraw && assetInfo.withdraw.enabled)
      .map(assetInfo => assetInfo.asset)
  }, [assetTransferInfos])

  const contentProps = {
    ...props,
    assetTransferInfos,
    trustedAssets,
    withdrawableAssets
  }

  return (
    <WithdrawalProvider account={props.account} actions={actions} state={state}>
      <WithdrawalDialogLayout
        account={props.account}
        dialogActionsRef={dialogActionsRef}
        onNavigateBack={actions.navigateBack}
      >
        {withdrawableAssets.length === 0 ? (
          <NoWithdrawableAssets account={props.account} actionsRef={dialogActionsRef} margin="32px 0 0" />
        ) : (
          <VirtualizedCarousel
            current={<WithdrawalContent {...contentProps} active dialogActionsRef={dialogActionsRef} state={state} />}
            index={prevStates.length}
            next={nextState ? <WithdrawalContent {...contentProps} state={nextState} /> : null}
            prev={prevState ? <WithdrawalContent {...contentProps} state={prevState} /> : null}
            size={prevStates.length + (nextState ? 2 : 1)}
          />
        )}
      </WithdrawalDialogLayout>
    </WithdrawalProvider>
  )
})

function ConnectedWithdrawalDialog(props: Pick<Props, "account" | "onClose">) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const closeAfterTimeout = React.useCallback(() => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }, [props.onClose])

  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <React.Suspense
          fallback={
            <WithdrawalDialogLayout account={props.account} dialogActionsRef={undefined} onNavigateBack={props.onClose}>
              <ViewLoading height={300} />
            </WithdrawalDialogLayout>
          }
        >
          <WithdrawalDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
        </React.Suspense>
      )}
    </TransactionSender>
  )
}

export default ConnectedWithdrawalDialog

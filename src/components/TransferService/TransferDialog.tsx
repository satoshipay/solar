import React from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { useTransferInfos } from "../../hooks/transfer-server"
import { useDialogActions } from "../../hooks/userinterface"
import { AccountData } from "../../lib/account"
import { getAssetsFromBalances } from "../../lib/stellar"
import VirtualizedCarousel from "../Layout/VirtualizedCarousel"
import VirtualizedFader from "../Layout/VirtualizedFader"
import TransactionSender from "../TransactionSender"
import ViewLoading from "../ViewLoading"
import { useDepositState } from "./useDepositState"
import { useWithdrawalState } from "./useWithdrawalState"
import DepositProvider from "./DepositProvider"
import NoWithdrawableAssets from "./NoWithdrawableAssets"
import { DesktopTwoColumns } from "./Sidebar"
import { TransferContent as PureTransferContent, TransferSidebar } from "./TransferContent"
import TransferDialogLayout from "./TransferDialogLayout"
import WithdrawalProvider from "./WithdrawalProvider"
import withFallback from "../Lazy/withFallback"

function flatMap<In, Out>(inputs: In[], mapper: (input: In) => Out[]): Out[] {
  return inputs.reduce<Out[]>((outputs, input): Out[] => [...outputs, ...mapper(input)], [])
}

const EmptyView = React.memo(function EmptyView() {
  return (
    <DesktopTwoColumns>
      <div />
      <div />
    </DesktopTwoColumns>
  )
})

const TransferContent = withFallback(
  PureTransferContent,
  <DesktopTwoColumns>
    <ViewLoading />
    <div />
  </DesktopTwoColumns>
)

interface Props {
  account: Account
  accountData: AccountData
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction) => Promise<any>
  type: "deposit" | "withdrawal"
}

const WithdrawalDialog = React.memo(function WithdrawalDialog(props: Props) {
  const dialogActionsRef = useDialogActions()
  const { actions, nextState, prevStates, state } =
    props.type === "deposit"
      ? useDepositState(props.account, props.onClose)
      : useWithdrawalState(props.account, props.onClose)

  const prevState = prevStates.length > 0 ? prevStates[prevStates.length - 1] : undefined

  const trustedAssets = React.useMemo(() => getAssetsFromBalances(props.accountData.balances) || [Asset.native()], [
    props.accountData.balances
  ])

  const transferInfos = useTransferInfos(trustedAssets, props.account.testnet)

  const assetTransferInfos = React.useMemo(
    () => flatMap(transferInfos, transferInfo => (transferInfo ? transferInfo.assets : [])),
    [transferInfos]
  )

  const transferableAssets = React.useMemo(() => {
    return assetTransferInfos
      .filter(assetInfo =>
        props.type === "deposit"
          ? assetInfo.deposit && assetInfo.deposit.enabled
          : assetInfo.withdraw && assetInfo.withdraw.enabled
      )
      .map(assetInfo => assetInfo.asset)
      .concat(props.type === "deposit" ? [Asset.native()] : [])
  }, [assetTransferInfos])

  const contentProps = {
    ...props,
    assetTransferInfos,
    transferableAssets,
    trustedAssets
  }

  const TransferProvider = props.type === "deposit" ? DepositProvider : WithdrawalProvider

  return (
    <TransferProvider account={props.account} actions={actions as any} state={state}>
      <TransferDialogLayout
        account={props.account}
        dialogActionsRef={dialogActionsRef}
        onNavigateBack={actions.navigateBack}
        type={props.type}
      >
        <DesktopTwoColumns>
          {transferableAssets.length === 0 ? (
            <NoWithdrawableAssets account={props.account} actionsRef={dialogActionsRef} margin="32px 0 0" />
          ) : (
            <VirtualizedCarousel
              current={<TransferContent {...contentProps} active dialogActionsRef={dialogActionsRef} state={state} />}
              index={prevStates.length}
              next={nextState ? <TransferContent {...contentProps} state={nextState} /> : <EmptyView />}
              prev={prevState ? <TransferContent {...contentProps} state={prevState} /> : null}
              size={prevStates.length + 2}
            />
          )}
          <VirtualizedFader
            current={<TransferSidebar state={state} type={props.type} />}
            index={prevStates.length}
            next={nextState ? <TransferSidebar state={nextState} type={props.type} /> : null}
            prev={prevState ? <TransferSidebar state={prevState} type={props.type} /> : null}
            size={prevStates.length + 2}
          />
        </DesktopTwoColumns>
      </TransferDialogLayout>
    </TransferProvider>
  )
})

function ConnectedWithdrawalDialog(props: Pick<Props, "account" | "onClose" | "type">) {
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
          <WithdrawalDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
        </React.Suspense>
      )}
    </TransactionSender>
  )
}

export default ConnectedWithdrawalDialog

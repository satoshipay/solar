import React from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { useTransferInfos } from "../../hooks/transfer-server"
import { useIsMobile, useDialogActions } from "../../hooks/userinterface"
import { AccountData } from "../../lib/account"
import { getAssetsFromBalances } from "../../lib/stellar"
import Carousel from "../Layout/Carousel"
import VirtualizedFader from "../Layout/VirtualizedFader"
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
import { TransferState } from "./statemachine"

const faderStyles: React.CSSProperties = {
  minWidth: 150
}

function flatMap<In, Out>(inputs: In[], mapper: (input: In) => Out[]): Out[] {
  return inputs.reduce<Out[]>((outputs, input): Out[] => [...outputs, ...mapper(input)], [])
}

function parseOverrides(overridesString: string) {
  const [assetCode, domain] = overridesString.split(":")
  return {
    [assetCode]: domain
  }
}

const TransferContent = withFallback(PureTransferContent, <ViewLoading />)

export interface TransferDialogProps {
  account: Account
  accountData: AccountData
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction) => Promise<any>
  type: "deposit" | "withdrawal"
}

function TransferDialog(props: TransferDialogProps) {
  const dialogActionsRef = useDialogActions()
  const isSmallScreen = useIsMobile()

  const { actions, nextState, prevStates, state } =
    props.type === "deposit"
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        useDepositState(props.account, props.onClose)
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useWithdrawalState(props.account, props.onClose)

  const prevState = prevStates.length > 0 ? prevStates[prevStates.length - 1] : undefined

  const trustedAssets = React.useMemo(() => getAssetsFromBalances(props.accountData.balances) || [Asset.native()], [
    props.accountData.balances
  ])

  // Allow overriding the transfer server domain by asset using an env var (for testing purposes)
  const assetTransferDomainOverrides = process.env.TRANSFER_DOMAIN_OVERRIDE
    ? parseOverrides(process.env.TRANSFER_DOMAIN_OVERRIDE)
    : {}
  const transferInfos = useTransferInfos(trustedAssets, props.account.testnet, assetTransferDomainOverrides)

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
  }, [assetTransferInfos, props.type])

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
            <Carousel current={prevStates.length}>
              {[...prevStates, state, nextState]
                .filter((s): s is TransferState => !!s)
                .map((current, index) => (
                  <TransferContent
                    key={index}
                    {...contentProps}
                    active={current === state}
                    dialogActionsRef={current === state ? dialogActionsRef : undefined}
                    state={current}
                  />
                ))}
            </Carousel>
          )}
          <VirtualizedFader
            current={<TransferSidebar state={state} type={props.type} />}
            index={prevStates.length}
            next={nextState ? <TransferSidebar state={nextState} type={props.type} /> : null}
            prev={prevState ? <TransferSidebar state={prevState} type={props.type} /> : null}
            size={prevStates.length + 2}
            style={isSmallScreen ? undefined : faderStyles}
          />
        </DesktopTwoColumns>
      </TransferDialogLayout>
    </TransferProvider>
  )
}

export default React.memo(TransferDialog)

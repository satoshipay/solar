import { AssetTransferInfo } from "@satoshipay/stellar-transfer"
import React from "react"
import { Asset, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { RefStateObject } from "../../hooks/userinterface"
import { DesktopTwoColumns } from "./Sidebar"
import DepositXLM from "./DepositXLM"
import TransferAuthentication from "./TransferAuthentication"
import TransferKYCDenied from "./TransferKYCDenied"
import TransferKYCPending from "./TransferKYCPending"
import WithdrawalDetailsForm from "./TransferDetailsForm"
import TransferInitial from "./TransferInitial"
import WithdrawalSuccess from "./WithdrawalSuccess"
import WithdrawalTransactionDetails from "./TransferTransactionDetails"
import { TransferState } from "./statemachine"

interface WithdrawalContentProps {
  account: Account
  active?: boolean
  assetTransferInfos: AssetTransferInfo[]
  dialogActionsRef?: RefStateObject
  onClose: () => void
  sendTransaction: (transaction: Transaction) => Promise<any>
  state: TransferState
  trustedAssets: Asset[]
  type: "deposit" | "withdrawal"
  transferableAssets: Asset[]
}

const DepositContent = React.memo(function WithdrawalContent(props: WithdrawalContentProps) {
  const { assetTransferInfos, state, trustedAssets, transferableAssets } = props

  if (state.step === "initial") {
    return (
      <DesktopTwoColumns>
        <TransferInitial
          assetTransferInfos={assetTransferInfos}
          dialogActionsRef={props.dialogActionsRef}
          state={state}
          trustedAssets={trustedAssets}
          type={props.type}
          transferableAssets={transferableAssets}
        />
        <TransferInitial.Sidebar type={props.type} />
      </DesktopTwoColumns>
    )
  } else if (state.step === "enter-values") {
    return (
      <DesktopTwoColumns>
        <WithdrawalDetailsForm
          active={props.active || false}
          assetTransferInfos={assetTransferInfos}
          dialogActionsRef={props.dialogActionsRef}
          state={state}
          type={props.type}
        />
        <WithdrawalDetailsForm.Sidebar type={props.type} />
      </DesktopTwoColumns>
    )
  } else if (state.step === "xlm-deposit") {
    return (
      <DesktopTwoColumns>
        <DepositXLM />
        <DepositXLM.Sidebar />
      </DesktopTwoColumns>
    )
  } else if (state.step === "auth-pending") {
    return (
      <DesktopTwoColumns>
        <TransferAuthentication
          account={props.account}
          assetTransferInfos={assetTransferInfos}
          authChallenge={"authChallenge" in state ? state.authChallenge : null}
          dialogActionsRef={props.dialogActionsRef}
          state={state}
          type={props.type}
        />
        <TransferAuthentication.Sidebar />
      </DesktopTwoColumns>
    )
  } else if (state.step === "kyc-pending") {
    return (
      <DesktopTwoColumns>
        <TransferKYCPending dialogActionsRef={props.dialogActionsRef} state={state} type={props.type} />
        <TransferKYCPending.Sidebar />
      </DesktopTwoColumns>
    )
  } else if (state.step === "kyc-denied") {
    return (
      <DesktopTwoColumns>
        <TransferKYCDenied state={state} />
        <TransferKYCDenied.Sidebar />
      </DesktopTwoColumns>
    )
  } else if (state.step === "enter-tx-details") {
    return (
      <DesktopTwoColumns>
        <WithdrawalTransactionDetails
          dialogActionsRef={props.dialogActionsRef}
          sendTransaction={props.sendTransaction}
          state={state}
          type={props.type}
        />
        <WithdrawalTransactionDetails.Sidebar type={props.type} />
      </DesktopTwoColumns>
    )
  } else if (state.step === "completed") {
    return props.type === "deposit" ? null : (
      <DesktopTwoColumns>
        <WithdrawalSuccess dialogActionsRef={props.dialogActionsRef} onClose={props.onClose} state={state} />
        <WithdrawalSuccess.Sidebar />
      </DesktopTwoColumns>
    )
  } else {
    throw Error(`Reached unexpected state: ${(state as TransferState).step}`)
  }
})

export default React.memo(DepositContent)

import { AssetTransferInfo } from "@satoshipay/stellar-transfer"
import React from "react"
import { Asset, Transaction } from "stellar-sdk"
import { Account } from "~App/contexts/accounts"
import { RefStateObject } from "~Generic/hooks/userinterface"
import DepositSuccess from "./DepositSuccess"
import DepositXLM from "./DepositXLM"
import TransferAuthentication from "./TransferAuthentication"
import TransferKYCDenied from "./TransferKYCDenied"
import TransferKYCPending from "./TransferKYCPending"
import WithdrawalDetailsForm from "./TransferDetailsForm"
import TransferInitial from "./TransferInitial"
import WithdrawalSuccess from "./WithdrawalSuccess"
import WithdrawalTransactionDetails from "./TransferTransactionDetails"
import { TransferState } from "../util/statemachine"

interface TransferContentProps {
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

export const TransferContent = React.memo(function TransferContent(props: TransferContentProps) {
  const { assetTransferInfos, state, trustedAssets, transferableAssets } = props

  if (state.step === "initial") {
    return (
      <TransferInitial
        assetTransferInfos={assetTransferInfos}
        dialogActionsRef={props.dialogActionsRef}
        state={state}
        trustedAssets={trustedAssets}
        type={props.type}
        transferableAssets={transferableAssets}
      />
    )
  } else if (state.step === "enter-values") {
    return (
      <WithdrawalDetailsForm
        active={props.active || false}
        assetTransferInfos={assetTransferInfos}
        dialogActionsRef={props.dialogActionsRef}
        state={state}
        type={props.type}
      />
    )
  } else if (state.step === "xlm-deposit") {
    return <DepositXLM onCloseDialog={props.onClose} />
  } else if (state.step === "auth-pending") {
    return (
      <TransferAuthentication
        account={props.account}
        assetTransferInfos={assetTransferInfos}
        authChallenge={"authChallenge" in state ? state.authChallenge : null}
        dialogActionsRef={props.dialogActionsRef}
        state={state}
        type={props.type}
      />
    )
  } else if (state.step === "kyc-pending") {
    return <TransferKYCPending dialogActionsRef={props.dialogActionsRef} state={state} type={props.type} />
  } else if (state.step === "kyc-denied") {
    return <TransferKYCDenied state={state} />
  } else if (state.step === "enter-tx-details") {
    return (
      <WithdrawalTransactionDetails
        dialogActionsRef={props.dialogActionsRef}
        sendTransaction={props.sendTransaction}
        state={state}
        type={props.type}
      />
    )
  } else if (state.step === "completed") {
    return props.type === "deposit" ? (
      <DepositSuccess dialogActionsRef={props.dialogActionsRef} onClose={props.onClose} state={state} />
    ) : (
      <WithdrawalSuccess dialogActionsRef={props.dialogActionsRef} onClose={props.onClose} state={state} />
    )
  } else {
    throw Error(`Reached unexpected state: ${(state as TransferState).step}`)
  }
})

interface TransferSidebarProps {
  state: TransferState
  type: "deposit" | "withdrawal"
}

export const TransferSidebar = React.memo(function TransferSidebar(props: TransferSidebarProps) {
  const { state, type } = props

  if (state.step === "initial") {
    return <TransferInitial.Sidebar type={type} />
  } else if (state.step === "enter-values") {
    return <WithdrawalDetailsForm.Sidebar type={type} />
  } else if (state.step === "xlm-deposit") {
    return <DepositXLM.Sidebar />
  } else if (state.step === "auth-pending") {
    return <TransferAuthentication.Sidebar />
  } else if (state.step === "kyc-pending") {
    return <TransferKYCPending.Sidebar />
  } else if (state.step === "kyc-denied") {
    return <TransferKYCDenied.Sidebar />
  } else if (state.step === "enter-tx-details") {
    return <WithdrawalTransactionDetails.Sidebar type={type} />
  } else if (state.step === "completed") {
    return type === "deposit" ? <DepositSuccess.Sidebar /> : <WithdrawalSuccess.Sidebar />
  } else {
    throw Error(`Reached unexpected state: ${(state as TransferState).step}`)
  }
})

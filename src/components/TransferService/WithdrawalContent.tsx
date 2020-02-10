import { AssetTransferInfo } from "@satoshipay/stellar-transfer"
import React from "react"
import { Asset, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { RefStateObject } from "../../hooks/userinterface"
import { DesktopTwoColumns } from "./Sidebar"
import WithdrawalAuthentication from "./TransferAuthentication"
import WithdrawalDetailsForm from "./WithdrawalDetailsForm"
import WithdrawalInitial from "./WithdrawalInitial"
import WithdrawalKYCDenied from "./TransferKYCDenied"
import WithdrawalKYCPending from "./TransferKYCPending"
import WithdrawalSuccess from "./WithdrawalSuccess"
import WithdrawalTransactionDetails from "./WithdrawalTransactionDetails"
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
  withdrawableAssets: Asset[]
}

const WithdrawalContent = React.memo(function WithdrawalContent(props: WithdrawalContentProps) {
  const { assetTransferInfos, state, trustedAssets, withdrawableAssets } = props

  if (state.step === "initial") {
    return (
      <DesktopTwoColumns>
        <WithdrawalInitial
          assetTransferInfos={assetTransferInfos}
          dialogActionsRef={props.dialogActionsRef}
          state={state}
          trustedAssets={trustedAssets}
          withdrawableAssets={withdrawableAssets}
        />
        <WithdrawalInitial.Sidebar />
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
        />
        <WithdrawalDetailsForm.Sidebar />
      </DesktopTwoColumns>
    )
  } else if (state.step === "auth-pending") {
    return (
      <DesktopTwoColumns>
        <WithdrawalAuthentication
          account={props.account}
          assetTransferInfos={assetTransferInfos}
          authChallenge={"authChallenge" in state ? state.authChallenge : null}
          dialogActionsRef={props.dialogActionsRef}
          state={state}
        />
        <WithdrawalAuthentication.Sidebar />
      </DesktopTwoColumns>
    )
  } else if (state.step === "kyc-pending") {
    return (
      <DesktopTwoColumns>
        <WithdrawalKYCPending dialogActionsRef={props.dialogActionsRef} state={state} />
        <WithdrawalKYCPending.Sidebar />
      </DesktopTwoColumns>
    )
  } else if (state.step === "kyc-denied") {
    return (
      <DesktopTwoColumns>
        <WithdrawalKYCDenied state={state} />
        <WithdrawalKYCDenied.Sidebar />
      </DesktopTwoColumns>
    )
  } else if (state.step === "enter-tx-details") {
    return (
      <DesktopTwoColumns>
        <WithdrawalTransactionDetails
          dialogActionsRef={props.dialogActionsRef}
          sendTransaction={props.sendTransaction}
          state={state}
        />
        <WithdrawalTransactionDetails.Sidebar />
      </DesktopTwoColumns>
    )
  } else if (state.step === "completed") {
    return (
      <DesktopTwoColumns>
        <WithdrawalSuccess dialogActionsRef={props.dialogActionsRef} onClose={props.onClose} state={state} />
        <WithdrawalSuccess.Sidebar />
      </DesktopTwoColumns>
    )
  } else {
    throw Error(`Reached unexpected state: ${(state as TransferState).step}`)
  }
})

export default React.memo(WithdrawalContent)

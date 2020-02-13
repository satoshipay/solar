// tslint:disable no-object-literal-type-assertion
import { WebauthData } from "@satoshipay/stellar-sep-10"
import {
  KYCInstructions,
  KYCStatusResponse,
  KYCResponseType,
  TransferServer,
  TransferTransaction,
  Withdrawal,
  WithdrawalInstructionsSuccess,
  WithdrawalTransaction
} from "@satoshipay/stellar-transfer"
import BigNumber from "big.js"
import { Asset, Transaction } from "stellar-sdk"

export namespace WithdrawalStates {
  export interface SelectType {
    step: "initial"
    asset?: Asset
    method?: string
    formValues: {
      [fieldName: string]: string | undefined
    }
  }

  export interface EnterBasics {
    step: "enter-values"
    asset: Asset
    method: string
    formValues: {
      [fieldName: string]: string | undefined
    }
    transferServer: TransferServer
  }

  export interface AuthPending {
    step: "auth-pending"
    authChallenge: Transaction
    webauth: WebauthData
    withdrawal: Withdrawal
  }

  export interface KYCPending {
    step: "kyc-pending"
    authToken?: string
    didRedirect?: boolean
    response: KYCInstructions<KYCResponseType>
    transfer?: TransferTransaction
    withdrawal: Withdrawal
  }

  export interface KYCDenied {
    step: "kyc-denied"
    response: KYCStatusResponse<"denied">
    withdrawal: Withdrawal
  }

  export interface EnterTxDetails {
    step: "enter-tx-details"
    response: WithdrawalInstructionsSuccess
    transfer?: WithdrawalTransaction
    withdrawal: Withdrawal
  }

  export interface WithdrawalCompleted {
    step: "completed"
    amount: BigNumber
    response: WithdrawalInstructionsSuccess
    withdrawal: Withdrawal
  }
}

export const Action = {
  navigateBack: () =>
    ({
      type: "navigate-back"
    } as const),

  selectType: (asset: Asset, method: string, transferServer: TransferServer) =>
    ({
      type: "select-type",
      asset,
      method,
      transferServer
    } as const),

  captureWithdrawalInput: (formValues: { [fieldName: string]: string | undefined }) =>
    ({
      type: "capture-fields",
      formValues
    } as const),

  conductAuth: (withdrawal: Withdrawal, webauth: WebauthData, authChallenge: Transaction) =>
    ({
      type: "conduct-auth",
      authChallenge,
      webauth,
      withdrawal
    } as const),

  setAuthToken: (authToken: string) =>
    ({
      type: "set-auth-token",
      authToken
    } as const),

  setDidRedirectToKYC: () =>
    ({
      type: "did-redirect-to-kyc"
    } as const),

  setTransferTransaction: (transaction: TransferTransaction) =>
    ({
      type: "set-transfer-transaction",
      transaction
    } as const),

  conductKYC: (withdrawal: Withdrawal, response: KYCInstructions<KYCResponseType>, authToken?: string) =>
    ({
      type: "conduct-kyc",
      authToken,
      response,
      withdrawal
    } as const),

  promptForTxDetails: (
    withdrawal: Withdrawal,
    response: WithdrawalInstructionsSuccess,
    transfer?: WithdrawalTransaction
  ) =>
    ({
      type: "prompt-for-tx-details",
      response,
      transfer,
      withdrawal
    } as const),

  completed: (amount: BigNumber) =>
    ({
      type: "completed",
      amount
    } as const),

  kycDenied: (response: KYCStatusResponse<"denied">) =>
    ({
      type: "kyc-denied",
      response
    } as const)
} as const

export type WithdrawalAction = ReturnType<(typeof Action)[keyof typeof Action]>

export type WithdrawalState =
  | WithdrawalStates.SelectType
  | WithdrawalStates.EnterBasics
  | WithdrawalStates.AuthPending
  | WithdrawalStates.KYCPending
  | WithdrawalStates.KYCDenied
  | WithdrawalStates.EnterTxDetails
  | WithdrawalStates.WithdrawalCompleted

export function shouldBackNavigationCloseDialog(state: WithdrawalState) {
  return state.step === "initial" || state.step === "completed" || state.step === "kyc-denied"
}

export const initialState: WithdrawalState = {
  step: "initial",
  formValues: {}
}

export function stateMachine(state: WithdrawalState, action: WithdrawalAction): WithdrawalState {
  switch (action.type) {
    case "navigate-back":
      if (state.step === "enter-values") {
        return {
          ...state,
          step: "initial"
        }
      } else if ("withdrawal" in state) {
        return {
          step: "enter-values",
          asset: state.withdrawal.asset,
          method: state.withdrawal.fields.type!,
          formValues: state.withdrawal.fields,
          transferServer: state.withdrawal.transferServer
        }
      } else {
        return state
      }
    case "select-type":
      return {
        ...(state as WithdrawalStates.SelectType),
        step: "enter-values",
        asset: action.asset,
        method: action.method,
        transferServer: action.transferServer
      }
    case "capture-fields":
      return {
        step: "enter-values",
        asset: (state as WithdrawalStates.EnterBasics).asset,
        formValues: action.formValues || (state as WithdrawalStates.EnterBasics).formValues,
        method: (state as WithdrawalStates.EnterBasics).method,
        transferServer: (state as WithdrawalStates.EnterBasics).transferServer
      }
    case "conduct-auth":
      return {
        step: "auth-pending",
        authChallenge: action.authChallenge,
        webauth: action.webauth,
        withdrawal: action.withdrawal
      }
    case "set-auth-token":
      return {
        ...state,
        authToken: action.authToken
      } as any
    case "conduct-kyc":
      return {
        step: "kyc-pending",
        authToken: action.authToken,
        response: action.response,
        withdrawal: action.withdrawal
      }
    case "did-redirect-to-kyc":
      return {
        ...(state as WithdrawalStates.KYCPending),
        didRedirect: true
      }
    case "set-transfer-transaction":
      return {
        ...(state as WithdrawalStates.KYCPending),
        transfer: action.transaction
      }
    case "prompt-for-tx-details":
      return {
        step: "enter-tx-details",
        response: action.response,
        transfer: action.transfer,
        withdrawal: action.withdrawal
      }
    case "completed":
      return {
        step: "completed",
        amount: action.amount,
        response: (state as WithdrawalStates.EnterTxDetails).response,
        withdrawal: (state as WithdrawalStates.EnterTxDetails).withdrawal
      }
    case "kyc-denied":
      return {
        step: "kyc-denied",
        response: action.response,
        withdrawal: (state as WithdrawalStates.KYCPending).withdrawal
      }
    default:
      throw Error(`Unexpected action: ${(action as WithdrawalAction).type}`)
  }
}

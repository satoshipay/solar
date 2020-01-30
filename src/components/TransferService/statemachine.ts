// tslint:disable no-object-literal-type-assertion
import {
  KYCStatusResponse,
  KYCResponseType,
  TransferServer,
  Withdrawal,
  WithdrawalInstructionsKYC,
  WithdrawalInstructionsSuccess
} from "@satoshipay/stellar-transfer"
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
      amount?: string
    }
    transferServer: TransferServer
  }

  export interface AuthPending {
    step: "auth-pending"
    withdrawal: Withdrawal
  }

  export interface KYCPending {
    step: "kyc-pending"
    authToken?: string
    response: WithdrawalInstructionsKYC<KYCResponseType>
    withdrawal: Withdrawal
  }

  export interface StellarTxPending {
    step: "stellar-tx-pending"
    response: WithdrawalInstructionsSuccess
    transaction: Transaction
    withdrawal: Withdrawal
  }

  export interface WithdrawalCompleted {
    step: "completed"
  }

  export interface KYCDenied {
    step: "kyc-denied"
    response: KYCStatusResponse<"denied">
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

  conductAuth: (withdrawal: Withdrawal) =>
    ({
      type: "conduct-auth",
      withdrawal
    } as const),

  setAuthToken: (authToken: string) =>
    ({
      type: "set-auth-token",
      authToken
    } as const),

  conductKYC: (withdrawal: Withdrawal, response: WithdrawalInstructionsKYC<KYCResponseType>, authToken?: string) =>
    ({
      type: "conduct-kyc",
      authToken,
      response,
      withdrawal
    } as const),

  waitForStellarTx: (response: WithdrawalInstructionsSuccess, transaction: Transaction) =>
    ({
      type: "wait-for-stellar-tx",
      response,
      transaction
    } as const),

  completed: () =>
    ({
      type: "completed"
    } as const),

  kycDenied: (response: KYCStatusResponse<"denied">) =>
    ({
      type: "kyc-denied",
      response
    } as const)
} as const

type WithdrawalAction = ReturnType<(typeof Action)[keyof typeof Action]>

type WithdrawalState =
  | WithdrawalStates.SelectType
  | WithdrawalStates.EnterBasics
  | WithdrawalStates.AuthPending
  | WithdrawalStates.KYCPending
  | WithdrawalStates.StellarTxPending
  | WithdrawalStates.WithdrawalCompleted
  | WithdrawalStates.KYCDenied

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
    case "wait-for-stellar-tx":
      return {
        step: "stellar-tx-pending",
        response: action.response,
        transaction: action.transaction,
        withdrawal: (state as WithdrawalStates.AuthPending | WithdrawalStates.KYCPending).withdrawal
      }
    case "completed":
      return {
        step: "completed"
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

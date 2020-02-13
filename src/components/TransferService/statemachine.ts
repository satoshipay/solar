// tslint:disable no-object-literal-type-assertion
import { WebauthData } from "@satoshipay/stellar-sep-10"
import {
  Deposit,
  DepositInstructionsSuccess,
  DepositTransaction,
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

export namespace TransferStates {
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

  export interface DepositXLM {
    step: "xlm-deposit"
  }

  interface TransferProps {
    deposit: Deposit | undefined
    withdrawal: Withdrawal | undefined
  }

  export interface AuthPending extends TransferProps {
    step: "auth-pending"
    authChallenge: Transaction
    webauth: WebauthData
  }

  export interface KYCPending<Transfer extends Deposit | Withdrawal> extends TransferProps {
    step: "kyc-pending"
    authToken?: string
    didRedirect?: boolean
    response: KYCInstructions<KYCResponseType>
    transfer?: Transfer extends Deposit ? DepositTransaction : WithdrawalTransaction
  }

  export interface KYCDenied extends TransferProps {
    step: "kyc-denied"
    response: KYCStatusResponse<"denied">
  }

  export interface EnterTxDetails<Transfer extends Deposit | Withdrawal> extends TransferProps {
    step: "enter-tx-details"
    response: Transfer extends Deposit ? DepositInstructionsSuccess : WithdrawalInstructionsSuccess
    transfer?: Transfer extends Deposit ? DepositTransaction : WithdrawalTransaction
  }

  export interface TransferCompleted<Transfer extends Deposit | Withdrawal> extends TransferProps {
    step: "completed"
    amount: BigNumber
    response: Transfer extends Deposit ? DepositInstructionsSuccess : WithdrawalInstructionsSuccess
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

  selectXLMDeposit: () =>
    ({
      type: "select-xlm-deposit"
    } as const),

  captureWithdrawalInput: (formValues: { [fieldName: string]: string | undefined }) =>
    ({
      type: "capture-fields",
      formValues
    } as const),

  conductAuth: <Transfer extends Deposit | Withdrawal>(
    deposit: Transfer extends Deposit ? Deposit : undefined,
    withdrawal: Transfer extends Withdrawal ? Withdrawal : undefined,
    webauth: WebauthData,
    authChallenge: Transaction
  ) =>
    ({
      type: "conduct-auth",
      authChallenge,
      deposit,
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

  conductKYC: <Transfer extends Deposit | Withdrawal>(
    deposit: Transfer extends Deposit ? Deposit : undefined,
    withdrawal: Transfer extends Withdrawal ? Withdrawal : undefined,
    response: KYCInstructions<KYCResponseType>,
    authToken?: string
  ) =>
    ({
      type: "conduct-kyc",
      authToken,
      deposit,
      response,
      withdrawal
    } as const),

  promptForTxDetails: <TransactionType extends DepositTransaction | WithdrawalTransaction>(
    deposit: DepositTransaction extends TransactionType ? Deposit : undefined,
    withdrawal: WithdrawalTransaction extends TransactionType ? Withdrawal : undefined,
    response: DepositTransaction extends TransactionType ? DepositInstructionsSuccess : WithdrawalInstructionsSuccess,
    transfer?: TransactionType
  ) =>
    ({
      type: "prompt-for-tx-details",
      deposit: deposit as Deposit | undefined,
      response: response as DepositInstructionsSuccess | WithdrawalInstructionsSuccess,
      transfer,
      withdrawal: withdrawal as Withdrawal | undefined
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

export type TransferAction = ReturnType<(typeof Action)[keyof typeof Action]>

export type TransferState =
  | TransferStates.SelectType
  | TransferStates.EnterBasics
  | TransferStates.DepositXLM
  | TransferStates.AuthPending
  | TransferStates.KYCPending<Deposit | Withdrawal>
  | TransferStates.KYCDenied
  | TransferStates.EnterTxDetails<Deposit | Withdrawal>
  | TransferStates.TransferCompleted<Deposit | Withdrawal>

export function shouldBackNavigationCloseDialog(state: TransferState) {
  return state.step === "initial" || state.step === "completed" || state.step === "kyc-denied"
}

export const initialState: TransferState = {
  step: "initial",
  formValues: {}
}

export function stateMachine(state: TransferState, action: TransferAction): TransferState {
  switch (action.type) {
    case "navigate-back":
      if (state.step === "enter-values") {
        return {
          ...state,
          step: "initial"
        }
      } else if (state.step === "xlm-deposit") {
        return {
          step: "initial",
          formValues: {}
        }
      } else if ("deposit" in state && state.deposit) {
        return {
          step: "enter-values",
          asset: state.deposit.asset,
          method: state.deposit.fields.type!,
          formValues: state.deposit.fields,
          transferServer: state.deposit.transferServer
        }
      } else if ("withdrawal" in state && state.withdrawal) {
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
        ...(state as TransferStates.SelectType),
        step: "enter-values",
        asset: action.asset,
        method: action.method,
        transferServer: action.transferServer
      }
    case "select-xlm-deposit":
      return {
        step: "xlm-deposit"
      }
    case "capture-fields":
      return {
        step: "enter-values",
        asset: (state as TransferStates.EnterBasics).asset,
        formValues: action.formValues || (state as TransferStates.EnterBasics).formValues,
        method: (state as TransferStates.EnterBasics).method,
        transferServer: (state as TransferStates.EnterBasics).transferServer
      }
    case "conduct-auth":
      return {
        step: "auth-pending",
        authChallenge: action.authChallenge,
        deposit: action.deposit,
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
        deposit: action.deposit,
        response: action.response,
        withdrawal: action.withdrawal
      }
    case "did-redirect-to-kyc":
      return {
        ...(state as TransferStates.KYCPending<Deposit | Withdrawal>),
        didRedirect: true
      }
    case "set-transfer-transaction":
      return {
        ...(state as TransferStates.KYCPending<Deposit | Withdrawal>),
        transfer: action.transaction
      }
    case "prompt-for-tx-details":
      return {
        step: "enter-tx-details",
        deposit: action.deposit,
        response: action.response,
        transfer: action.transfer,
        withdrawal: action.withdrawal
      }
    case "completed":
      return {
        step: "completed",
        amount: action.amount,
        deposit: (state as TransferStates.EnterTxDetails<Deposit | Withdrawal>).deposit,
        response: (state as TransferStates.EnterTxDetails<Deposit | Withdrawal>).response,
        withdrawal: (state as TransferStates.EnterTxDetails<Deposit | Withdrawal>).withdrawal
      }
    case "kyc-denied":
      return {
        step: "kyc-denied",
        deposit: (state as TransferStates.EnterTxDetails<Deposit | Withdrawal>).deposit,
        response: action.response,
        withdrawal: (state as TransferStates.KYCPending<Deposit | Withdrawal>).withdrawal
      }
    default:
      throw Error(`Unexpected action: ${(action as TransferAction).type}`)
  }
}

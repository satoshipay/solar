// tslint:disable no-object-literal-type-assertion
import {
  DepositSuccessResponse,
  DepositTransaction,
  KYCInteractiveResponse,
  TransferServer,
  WithdrawalSuccessResponse,
  WithdrawalTransaction
} from "@satoshipay/stellar-sep-6"
import { WebauthData } from "@satoshipay/stellar-sep-10"
import { Asset, Transaction } from "stellar-sdk"

interface TransferBasics {
  asset: Asset
  method: string
}

interface TransferDetails {
  formValues: {
    [fieldName: string]: string
  }
}

interface DetailedState {
  basics: TransferBasics
  details: TransferDetails
}

export interface InitialState {
  step: "initial"
  basics?: TransferBasics
}

export interface AfterMethodSelectionState {
  step: "after-method-selection"
  basics: TransferBasics
}

export interface BeforeWebauthState extends DetailedState {
  step: "before-webauth"
  webauth?: WebauthData & { transaction: Transaction }
}

export interface AfterWebauthState extends DetailedState {
  step: "after-webauth"
  authToken?: string
}

export interface BeforeKYCState extends DetailedState {
  step: "before-interactive-kyc"
  kyc: KYCInteractiveResponse
}

export interface PendingKYCState extends DetailedState {
  step: "pending-kyc"
  transaction?: DepositTransaction | WithdrawalTransaction
}

export interface AfterDeniedKYCState extends DetailedState {
  step: "after-denied-kyc"
}

export interface AfterSuccessfulKYC<SuccessResponse extends DepositSuccessResponse | WithdrawalSuccessResponse> {
  step: "after-successful-kyc"
  authToken?: string
  transfer: SuccessResponse
}

export interface AfterTransactionState {
  step: "after-tx-submission"
}

export type TransferState<SuccessResponse extends DepositSuccessResponse | WithdrawalSuccessResponse> =
  | InitialState
  | BeforeWebauthState
  | AfterWebauthState
  | BeforeKYCState
  | PendingKYCState
  | AfterDeniedKYCState
  | AfterSuccessfulKYC<SuccessResponse>
  | AfterTransactionState

const backToStart = () =>
  ({
    type: "back-to-start"
  } as const)

const saveInitFormData = (
  transferServer: TransferServer,
  asset: Asset,
  method: string,
  formValues: { [fieldName: string]: string },
  webauth: WebauthData & { transaction: Transaction } | undefined
) =>
  ({
    type: "save-init-form",
    asset,
    formValues,
    method,
    transferServer,
    webauth
  } as const)

const setAuthToken = (token: string | undefined) =>
  ({
    type: "set-auth-token",
    token
  } as const)

const startInteractiveKYC = (response: KYCInteractiveResponse) =>
  ({
    type: "start-interactive-kyc",
    response
  } as const)

const pendingKYC = (transaction: DepositTransaction | WithdrawalTransaction | undefined) =>
  ({
    type: "kyc-pending",
    transaction
  } as const)

const failedKYC = () =>
  ({
    type: "kyc-denied"
  } as const)

const successfulKYC = (response: WithdrawalSuccessResponse) =>
  ({
    type: "kyc-successful",
    response
  } as const)

const transactionSubmitted = () =>
  ({
    type: "after-tx-submission"
  } as const)

type TransferAction =
  | ReturnType<typeof backToStart>
  | ReturnType<typeof saveInitFormData>
  | ReturnType<typeof setAuthToken>
  | ReturnType<typeof startInteractiveKYC>
  | ReturnType<typeof failedKYC>
  | ReturnType<typeof pendingKYC>
  | ReturnType<typeof successfulKYC>
  | ReturnType<typeof transactionSubmitted>

export const Action = {
  backToStart,
  saveInitFormData,
  setAuthToken,
  startInteractiveKYC,
  failedKYC,
  pendingKYC,
  successfulKYC,
  transactionSubmitted
}

export const initialState: TransferState<any> = {
  step: "initial"
}

export function stateMachine(state: TransferState<any>, action: TransferAction): TransferState<any> {
  switch (action.type) {
    case "back-to-start":
      return {
        step: "initial",
        details: "details" in state ? state.details : undefined
      }
    case "save-init-form":
      if (action.webauth) {
        return {
          step: "before-webauth",
          details: {
            asset: action.asset,
            formValues: action.formValues,
            method: action.method,
            transferServer: action.transferServer
          },
          webauth: action.webauth
        }
      } else {
        return {
          step: "after-webauth",
          authToken: undefined,
          details: {
            asset: action.asset,
            formValues: action.formValues,
            method: action.method,
            transferServer: action.transferServer
          }
        }
      }
    case "set-auth-token":
      if (state.step !== "before-webauth") {
        throw Error("Cannot set auth token at this time.")
      }
      return {
        ...state,
        step: "after-webauth",
        authToken: action.token
      }
    case "start-interactive-kyc":
      if (!("details" in state) || state.step === "initial") {
        throw Error(`Cannot perform ${action.type} in state ${state.step}.`)
      }
      return {
        step: "before-interactive-kyc",
        details: state.details,
        kyc: action.response
      }
    case "kyc-pending":
      if (!("details" in state) || state.step === "initial") {
        throw Error(`Cannot perform ${action.type} in state ${state.step}.`)
      }
      return {
        step: "pending-kyc",
        details: state.details,
        transaction: action.transaction
      }
    case "kyc-denied":
      if (!("details" in state) || state.step === "initial") {
        throw Error(`Cannot perform ${action.type} in state ${state.step}.`)
      }
      return {
        step: "after-denied-kyc",
        details: state.details
      }
    case "kyc-successful":
      if (!("details" in state) || state.step === "initial") {
        throw Error(`Cannot perform ${action.type} in state ${state.step}.`)
      }
      return {
        step: "after-successful-kyc",
        details: state.details,
        transfer: action.response
      }
    case "after-tx-submission":
      return {
        step: "after-tx-submission"
      }
    default:
      throw Error(`Unexpected action: ${(action as TransferAction).type}`)
  }
}

// tslint:disable no-object-literal-type-assertion
import {
  WithdrawalKYCInteractiveResponse,
  WithdrawalKYCNonInteractiveResponse,
  WithdrawalKYCStatusResponse,
  WithdrawalSuccessResponse,
  TransferServer
} from "@satoshipay/stellar-sep-6"
import { Asset } from "stellar-sdk"

type WithdrawalResponse =
  | WithdrawalKYCInteractiveResponse
  | WithdrawalKYCNonInteractiveResponse
  | WithdrawalKYCStatusResponse
  | WithdrawalSuccessResponse

type WithdrawalState =
  | {
      step: "initial"
    }
  | {
      step: "web-auth-pending"
      asset: Asset
      authToken?: string
      firstFormValues: { [fieldName: string]: string }
      method: string
      transferServer: TransferServer
    }
  | {
      step: "kyc-pending"
      asset: Asset
      authToken?: string
      firstFormValues: { [fieldName: string]: string }
      method: string
      transferServer: TransferServer
    }
  | {
      step: "kyc-done"
      asset: Asset
      authToken?: string
      firstFormValues: { [fieldName: string]: string }
      method: string
      transferServer: TransferServer
    }
  | {
      step: "tx-submitted"
    }

export const backToStart = () =>
  ({
    type: "back-to-start"
  } as const)

export const saveInitFormData = (
  transferServer: TransferServer,
  asset: Asset,
  method: string,
  formValues: { [fieldName: string]: string }
) =>
  ({
    type: "save-init-form",
    asset,
    formValues,
    method,
    transferServer
  } as const)

export const setAuthToken = (token: string | undefined) =>
  ({
    type: "set-auth-token",
    token
  } as const)

export const receivedResponse = (response: WithdrawalResponse) =>
  ({
    type: "received-response",
    response
  } as const)

export const transactionSubmitted = () =>
  ({
    type: "tx-submitted"
  } as const)

type WithdrawalAction =
  | ReturnType<typeof backToStart>
  | ReturnType<typeof saveInitFormData>
  | ReturnType<typeof setAuthToken>
  | ReturnType<typeof receivedResponse>
  | ReturnType<typeof transactionSubmitted>

export const initialState: WithdrawalState = {
  step: "initial"
}

export function stateMachine(state: WithdrawalState, action: WithdrawalAction): WithdrawalState {
  switch (action.type) {
    case "back-to-start":
      return initialState
    case "save-init-form":
      return {
        step: "web-auth-pending",
        asset: action.asset,
        firstFormValues: action.formValues,
        method: action.method,
        transferServer: action.transferServer
      }
    case "set-auth-token":
      if (state.step !== "web-auth-pending") {
        throw Error("Cannot set auth token at this time.")
      }
      return {
        ...state,
        authToken: action.token
      }
    case "received-response":
      if (state.step !== "web-auth-pending" && state.step !== "kyc-pending") {
        throw Error(`Cannot perform action ${action.type} in state ${state.step}.`)
      }
      if (!("type" in action.response)) {
        return {
          ...state,
          step: "kyc-done"
        }
      } else {
        return {
          ...state,
          step: "kyc-pending"
        }
      }
    case "tx-submitted":
      return {
        step: "tx-submitted"
      }
    default:
      throw Error(`Unexpected action: ${(action as WithdrawalAction).type}`)
  }
}

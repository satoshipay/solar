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

interface GeneralWithdrawalDetails {
  asset: Asset
  firstFormValues: { [fieldName: string]: string }
  method: string
  transferServer: TransferServer
}

type WithdrawalState =
  | {
      step: "initial"
      details?: Partial<GeneralWithdrawalDetails>
    }
  | {
      step: "after-withdrawal-form"
      details: GeneralWithdrawalDetails
    }
  | {
      step: "after-webauth"
      authToken?: string
      details: GeneralWithdrawalDetails
    }
  | {
      step: "after-kyc"
      authToken?: string
      details: GeneralWithdrawalDetails
      withdrawal: WithdrawalSuccessResponse
    }
  | {
      step: "after-tx-submission"
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
    type: "after-tx-submission"
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
      return {
        step: "initial",
        details: "details" in state ? state.details : undefined
      }
    case "save-init-form":
      return {
        step: "after-withdrawal-form",
        details: {
          asset: action.asset,
          firstFormValues: action.formValues,
          method: action.method,
          transferServer: action.transferServer
        }
      }
    case "set-auth-token":
      if (state.step !== "after-withdrawal-form") {
        throw Error("Cannot set auth token at this time.")
      }
      return {
        ...state,
        step: "after-webauth",
        authToken: action.token
      }
    case "received-response":
      if (state.step !== "after-webauth") {
        throw Error(`Cannot perform action ${action.type} in state ${state.step}.`)
      }
      if (!("type" in action.response)) {
        return {
          ...state,
          step: "after-kyc",
          withdrawal: action.response
        }
      } else {
        return {
          ...state,
          step: "after-webauth"
        }
      }
    case "after-tx-submission":
      return {
        step: "after-tx-submission"
      }
    default:
      throw Error(`Unexpected action: ${(action as WithdrawalAction).type}`)
  }
}

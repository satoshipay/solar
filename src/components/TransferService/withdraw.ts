import React from "react"
import { Asset, Transaction } from "stellar-sdk"
import {
  withdraw,
  TransferServer,
  TransferStatus,
  WithdrawalRequestKYC,
  WithdrawalRequestSuccess
} from "@satoshipay/stellar-sep-6"
import { WebauthData } from "@satoshipay/stellar-sep-10"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useHorizonURL, useWebAuth } from "../../hooks/stellar"
import { signTransaction } from "../../lib/transaction"
import { Action, initialState, stateMachine, BeforeWebauthState } from "./statemachine"
import { usePolling } from "./util"

export interface WithdrawalRequestData {
  account: string
  asset: Asset
  formValues: {
    [fieldName: string]: string
  }
  method: string
  transferServer: TransferServer
}

const kycPollIntervalMs = 6000

function sendWithdrawalRequest(request: WithdrawalRequestData, authToken?: string) {
  const { account, asset, formValues, method, transferServer } = request
  return withdraw(transferServer, method, asset.getCode(), authToken, { account, ...formValues } as any)
}

export function useWithdrawalState(account: Account) {
  const horizonURL = useHorizonURL(account.testnet)
  const WebAuth = useWebAuth()

  const [state, dispatch] = React.useReducer(stateMachine, initialState)
  const [withdrawalRequestPending, setWithdrawalRequestPending] = React.useState(false)
  const [withdrawalResponsePending, setWithdrawalResponsePending] = React.useState(false)

  const handleWithdrawalInitResponse = (response: WithdrawalRequestSuccess | WithdrawalRequestKYC) => {
    if (response.type === "success") {
      dispatch(Action.successfulKYC(response.data))
      stopKYCPolling()
    } else if (response.data.type === "interactive_customer_info_needed") {
      dispatch(Action.startInteractiveKYC(response.data))
    } else {
      throw Error(`Unexpected response type: ${response.type} / ${response.data.type}`)
    }
  }

  const handleWithdrawalFormSubmission = async (
    transferServer: TransferServer,
    asset: Asset,
    method: string,
    formValues: { [fieldName: string]: string }
  ) => {
    try {
      const withdrawalRequest: WithdrawalRequestData = {
        account: account.publicKey,
        asset,
        formValues,
        method,
        transferServer
      }
      setWithdrawalRequestPending(true)
      const webauthMetadata = await WebAuth.fetchWebAuthData(horizonURL, asset.getIssuer())

      if (webauthMetadata) {
        const webauth = {
          ...webauthMetadata,
          transaction: await WebAuth.fetchChallenge(
            webauthMetadata.endpointURL,
            webauthMetadata.signingKey,
            account.publicKey
          )
        }
        const cachedAuthToken = WebAuth.getCachedAuthToken(webauthMetadata.endpointURL, account.publicKey)
        dispatch(Action.saveInitFormData(transferServer, asset, method, formValues, webauth))

        if (cachedAuthToken) {
          dispatch(Action.setAuthToken(cachedAuthToken))
          await requestWithdrawal(withdrawalRequest, cachedAuthToken)
        }
      } else {
        dispatch(Action.saveInitFormData(transferServer, asset, method, formValues, undefined))
        await requestWithdrawal(withdrawalRequest)
      }
    } catch (error) {
      trackError(error)
    } finally {
      setWithdrawalRequestPending(false)
    }
  }

  const performWebAuthentication = async (
    details: BeforeWebauthState["details"],
    webauthData: WebauthData & { transaction: Transaction },
    password: string | null
  ) => {
    try {
      const withdrawalRequest: WithdrawalRequestData = {
        ...details,
        account: account.publicKey
      }
      const transaction = await signTransaction(webauthData.transaction, account, password)
      const authToken = await WebAuth.postResponse(webauthData.endpointURL, transaction, account.testnet)
      dispatch(Action.setAuthToken(authToken))
      await requestWithdrawal(withdrawalRequest, authToken)
    } catch (error) {
      // tslint:disable-next-line no-console
      console.error(error)
      trackError(Error("Web authentication failed"))
    }
  }

  const requestWithdrawal = async (withdrawalRequest: WithdrawalRequestData, authToken?: string) => {
    try {
      setWithdrawalResponsePending(true)
      const initResponse = await sendWithdrawalRequest(withdrawalRequest, authToken)
      handleWithdrawalInitResponse(initResponse)

      if (initResponse.type === "kyc") {
        // sandbox.anchorusd.com seems to use `identifier` instead of `id`
        const transactionID = (initResponse.data as any).id || (initResponse.data as any).identifier
        startKYCPolling(() => pollKYCStatus(withdrawalRequest, transactionID, authToken))
      }
    } catch (error) {
      trackError(error)
    } finally {
      setWithdrawalResponsePending(false)
    }
  }

  const pollKYCStatus = async (request: WithdrawalRequestData, transferTxId: string, authToken?: string) => {
    if (window.navigator.onLine !== false) {
      try {
        const { transaction } = await request.transferServer.fetchTransaction(transferTxId)

        if (transaction.status === TransferStatus.incomplete) {
          // Transfer transaction is still incomplete. Waiting for KYC to finish…
          return
        }
      } catch (error) {
        // tslint:disable-next-line no-console
        console.warn(error)
        return
      }
      const response = await sendWithdrawalRequest(request, authToken)
      handleWithdrawalInitResponse(response)
    }
  }

  const { start: startKYCPolling, stop: stopKYCPolling } = usePolling(kycPollIntervalMs)

  const startOver = () => {
    stopKYCPolling()
    dispatch(Action.backToStart())
  }

  const actions = {
    handleWithdrawalFormSubmission,
    performWebAuthentication,
    startOver
  }

  return {
    actions,
    state,
    withdrawalRequestPending,
    withdrawalResponsePending
  }
}

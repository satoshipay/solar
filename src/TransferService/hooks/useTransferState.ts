import BigNumber from "big.js"
import React from "react"
import { Asset, Transaction } from "stellar-sdk"
import { getServiceSigningKey, getWebAuthEndpointURL, WebauthData } from "@satoshipay/stellar-sep-10"
import { fetchTransaction, fetchTransferInfos, TransferServer } from "@satoshipay/stellar-transfer"
import { Account } from "../../App/context/accounts"
import { SigningKeyCacheContext } from "../../App/context/caches"
import { trackError } from "../../App/context/notifications"
import { stellarTomlCache } from "../../Generic/hooks/_caches"
import { useWebAuth } from "../../Generic/hooks/stellar"
import { useNetWorker } from "../../Generic/hooks/workers"
import { signTransaction } from "../../Generic/lib/transaction"
import { initialState, stateMachine, Action, TransferAction, TransferState, TransferStates } from "../util/statemachine"
import { usePolling } from "../util/util"

export interface TransferMachineState {
  current: TransferState
  next?: TransferState
  prevs: TransferState[]
}

const kycPollIntervalMs = 6000

const initialMachineState: TransferMachineState = {
  current: initialState,
  prevs: []
}

function timeTravelingStateMachine(machineState: TransferMachineState, action: TransferAction): TransferMachineState {
  const nextState = stateMachine(machineState.current, action)
  const goingForward = action.type !== "navigate-back"

  if (nextState.step !== machineState.current.step && goingForward) {
    return {
      prevs: [...machineState.prevs, machineState.current],
      current: nextState,
      next: undefined
    }
  } else if (nextState.step !== machineState.current.step && !goingForward) {
    return {
      prevs: machineState.prevs.slice(0, -1),
      next: machineState.current,
      current: nextState
    }
  } else {
    return {
      ...machineState,
      current: nextState
    }
  }
}

export function useTransferState(account: Account, closeDialog: () => void) {
  const netWorker = useNetWorker()
  const signingKeys = React.useContext(SigningKeyCacheContext)
  const WebAuth = useWebAuth()

  const [machineState, dispatch] = React.useReducer(timeTravelingStateMachine, initialMachineState)

  const submitTransferSelection = async (transferServer: TransferServer, asset: Asset, method: string | null) => {
    dispatch(Action.selectType(asset, method || "", transferServer))
  }

  const initiateWebAuth = async (
    transferServer: TransferServer
  ): Promise<[undefined, undefined] | [WebauthData, string | undefined]> => {
    const stellarTomlCacheItem = stellarTomlCache.get(transferServer.domain)
    const stellarTomlData =
      stellarTomlCacheItem && stellarTomlCacheItem[0]
        ? stellarTomlCacheItem[1]
        : await netWorker.fetchStellarToml(transferServer.domain)

    const endpointURL = getWebAuthEndpointURL(stellarTomlData)

    if (!endpointURL) {
      return [undefined, undefined]
    }

    const webauthMetadata: WebauthData = {
      domain: transferServer.domain,
      endpointURL,
      signingKey: getServiceSigningKey(stellarTomlData) || null
    }

    if (webauthMetadata.signingKey) {
      signingKeys.store(webauthMetadata.signingKey, webauthMetadata.domain)
    }

    const cachedAuthToken = WebAuth.getCachedAuthToken(webauthMetadata.endpointURL, account.publicKey)
    return [webauthMetadata, cachedAuthToken]
  }

  const performWebAuth = async (webauthMetadata: WebauthData, challenge: Transaction, password: string | null) => {
    const transaction = await signTransaction(challenge, account, password)
    const authToken = await WebAuth.postResponse(webauthMetadata.endpointURL, transaction, account.testnet)

    dispatch(Action.setAuthToken(authToken))
    return authToken
  }

  const submitTransferFieldValues = async (details: Omit<TransferStates.EnterBasics, "step">) => {
    dispatch(Action.captureWithdrawalInput(details.formValues))

    const infos = await fetchTransferInfos(details.transferServer)
    const assetInfo = infos.assets.find(info => info.asset.equals(details.asset))
    const withdraw = assetInfo && assetInfo.withdraw

    if (!withdraw || !withdraw.enabled) {
      throw Error(`Asset ${details.asset.code} seems to not be withdrawable via ${details.transferServer.domain}`)
    }

    const [webauth, cachedAuthToken] = await initiateWebAuth(details.transferServer)

    if (cachedAuthToken) {
      dispatch(Action.setAuthToken(cachedAuthToken))
    }

    return [webauth, cachedAuthToken] as const
  }

  const didRedirectToKYC = () => dispatch(Action.setDidRedirectToKYC())
  const afterSuccessfulExecution = (amount: BigNumber) => dispatch(Action.completed(amount))

  let consecutiveKYCPollErrors = 0

  const pollKYCStatus = async (transferServer: TransferServer, transferTxId: string, authToken: string | undefined) => {
    if (window.navigator.onLine === false) {
      return
    }

    try {
      const { transaction } = await fetchTransaction(transferServer, transferTxId, "transfer", authToken)

      consecutiveKYCPollErrors = 0
      dispatch(Action.setTransferTransaction(transaction))

      return transaction
    } catch (error) {
      consecutiveKYCPollErrors++

      if (consecutiveKYCPollErrors <= 3) {
        trackError(error)
      }
    }
  }

  const { isActive: isKYCPollingActive, start: startKYCPolling, stop: stopKYCPolling } = usePolling(kycPollIntervalMs)

  const navigateBack = () => {
    if (isKYCPollingActive()) {
      stopKYCPolling()
    }

    if (["completed", "initial", "kyc-denied"].indexOf(machineState.current.step) > -1) {
      closeDialog()
    } else {
      dispatch(Action.navigateBack())
    }
  }

  const transfer = {
    afterSuccessfulExecution,
    didRedirectToKYC,
    initiateWebAuth,
    isKYCPollingActive,
    navigateBack,
    performWebAuth,
    pollKYCStatus,
    startKYCPolling,
    stopKYCPolling,
    submitTransferFieldValues,
    submitTransferSelection
  }

  return {
    dispatch,
    machineState,
    transfer
  }
}

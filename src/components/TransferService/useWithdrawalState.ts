import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon, Memo, Networks, Operation, Server, Transaction, xdr } from "stellar-sdk"
import { getServiceSigningKey, getWebAuthEndpointURL, WebauthData } from "@satoshipay/stellar-sep-10"
import {
  fetchTransaction,
  fetchTransferInfos,
  KYCResponseType,
  TransferResultType,
  TransferServer,
  TransferStatus,
  Withdrawal,
  WithdrawalInstructionsSuccess,
  WithdrawalSuccessResponse,
  WithdrawalTransaction
} from "@satoshipay/stellar-transfer"
import { Account } from "../../context/accounts"
import { SigningKeyCacheContext } from "../../context/caches"
import { trackError } from "../../context/notifications"
import { stellarTomlCache } from "../../hooks/_caches"
import { useHorizonURL, useWebAuth } from "../../hooks/stellar"
import { useNetWorker } from "../../hooks/workers"
import { createTransaction, signTransaction } from "../../lib/transaction"
import { initialState, stateMachine, Action, WithdrawalAction, WithdrawalState, WithdrawalStates } from "./statemachine"
import { usePolling } from "./util"

export interface WithdrawalMachineState {
  current: WithdrawalState
  next?: WithdrawalState
  prevs: WithdrawalState[]
}

const kycPollIntervalMs = 6000

const initialMachineState: WithdrawalMachineState = {
  current: initialState,
  prevs: []
}

function fail(message: string): never {
  throw Error(message)
}

function timeTravelingStateMachine(
  machineState: WithdrawalMachineState,
  action: WithdrawalAction
): WithdrawalMachineState {
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

function createWithdrawal(state: Omit<WithdrawalStates.EnterBasics, "step">): Withdrawal {
  const fields = {
    ...(state.formValues as Record<string, string>),
    type: state.method
  }
  return Withdrawal(state.transferServer, state.asset, fields)
}

function createMemo(response: WithdrawalSuccessResponse): Memo | undefined {
  if (response.memo_type === "text" && response.memo) {
    return Memo.text(response.memo)
  } else if (response.memo_type === "hash" && response.memo) {
    return Memo.hash(response.memo)
  } else if (response.memo_type === "id" && response.memo) {
    return Memo.id(response.memo)
  } else {
    return undefined
  }
}

async function createWithdrawalTransaction(
  account: Account,
  accountData: Horizon.AccountResponse,
  amount: BigNumber,
  horizon: Server,
  instructions: WithdrawalInstructionsSuccess,
  withdrawal: Withdrawal
): Promise<Transaction> {
  const memo = createMemo(instructions.data)

  const operations: xdr.Operation[] = [
    Operation.payment({
      amount: String(amount),
      asset: withdrawal.asset,
      destination: instructions.data.account_id
    })
  ]

  return createTransaction(operations, {
    accountData,
    horizon,
    memo,
    walletAccount: account
  })
}

export function useWithdrawalState(account: Account, closeDialog: () => void) {
  const netWorker = useNetWorker()
  const horizonURL = useHorizonURL(account.testnet)
  const signingKeys = React.useContext(SigningKeyCacheContext)
  const WebAuth = useWebAuth()

  const [machineState, dispatch] = React.useReducer(timeTravelingStateMachine, initialMachineState)

  const submitWithdrawalSelection = async (transferServer: TransferServer, asset: Asset, method: string | null) => {
    dispatch(Action.selectType(asset, method || "", transferServer))
  }

  const initiateWebAuth = async (withdrawal: Withdrawal) => {
    const { transferServer } = withdrawal
    const stellarTomlData =
      stellarTomlCache.get(transferServer.domain) || (await netWorker.fetchStellarToml(transferServer.domain))

    const endpointURL =
      getWebAuthEndpointURL(stellarTomlData) || fail(`No web auth endpoint found at ${transferServer.domain}`)

    const webauthMetadata: WebauthData = {
      domain: transferServer.domain,
      endpointURL,
      signingKey: getServiceSigningKey(stellarTomlData) || null
    }

    if (webauthMetadata.signingKey) {
      signingKeys.store(webauthMetadata.signingKey, webauthMetadata.domain)
    }

    if (!webauthMetadata) {
      throw Error(`Cannot initialize Stellar web authentication at ${transferServer.domain}`)
    }

    const cachedAuthToken = WebAuth.getCachedAuthToken(webauthMetadata.endpointURL, account.publicKey)

    return [webauthMetadata, cachedAuthToken] as const
  }

  const requestWithdrawal = async (withdrawal: Withdrawal, authToken?: string, transfer?: WithdrawalTransaction) => {
    const instructions = await withdrawal.interactive(authToken)

    if (instructions.type === TransferResultType.ok) {
      dispatch(Action.promptForTxDetails(withdrawal, instructions, transfer))
      stopKYCPolling()
    } else if (instructions.type === TransferResultType.kyc && instructions.subtype === KYCResponseType.interactive) {
      // sandbox.anchorusd.com seems to use `identifier` instead of `id`
      const transactionID = (instructions.data as any).id || (instructions.data as any).identifier

      if (!isKYCPollingActive()) {
        startKYCPolling(() => pollKYCStatus(withdrawal, transactionID, authToken))

        dispatch(
          Action.conductKYC(
            withdrawal,
            instructions,
            "authToken" in machineState.current ? machineState.current.authToken : undefined
          )
        )

        // Poll status immediately in case the withdrawal is already pending
        pollKYCStatus(withdrawal, transactionID, authToken)
      }
    } else {
      throw Error(`Unexpected response type: ${instructions.type} / ${instructions.data.type}`)
    }

    return instructions
  }

  const performWebAuth = async (
    withdrawal: Withdrawal,
    webauthMetadata: WebauthData,
    challenge: Transaction,
    password: string | null
  ) => {
    const transaction = await signTransaction(challenge, account, password)
    const authToken = await WebAuth.postResponse(webauthMetadata.endpointURL, transaction, account.testnet)

    dispatch(Action.setAuthToken(authToken))
    await requestWithdrawal(withdrawal, authToken)

    return authToken
  }

  const submitWithdrawalFieldValues = async (details: Omit<WithdrawalStates.EnterBasics, "step">) => {
    dispatch(Action.captureWithdrawalInput(details.formValues))

    const infos = await fetchTransferInfos(details.transferServer)
    const assetInfo = infos.assets.find(info => info.asset.equals(details.asset))
    const withdraw = assetInfo && assetInfo.withdraw

    if (!withdraw || !withdraw.enabled) {
      throw Error(`Asset ${details.asset.code} seems to not be withdrawable via ${details.transferServer.domain}`)
    }

    const withdrawal = createWithdrawal(details)
    const [webauth, cachedAuthToken] = await initiateWebAuth(withdrawal)

    if (cachedAuthToken) {
      dispatch(Action.setAuthToken(cachedAuthToken))
      await requestWithdrawal(withdrawal, cachedAuthToken)
    } else {
      const network = account.testnet ? Networks.TESTNET : Networks.PUBLIC
      const authChallenge = await WebAuth.fetchChallenge(
        webauth.endpointURL,
        webauth.signingKey,
        account.publicKey,
        network
      )
      dispatch(Action.conductAuth(withdrawal, webauth, authChallenge))
    }
  }

  const prepareWithdrawalTransaction = async (
    withdrawal: Withdrawal,
    instructions: WithdrawalInstructionsSuccess,
    amount: BigNumber
  ) => {
    const accountData = await netWorker.fetchAccountData(horizonURL, account.publicKey)

    if (!accountData) {
      throw Error(`Cannot fetch account data of ${account.publicKey} from ${horizonURL}`)
    }

    return createWithdrawalTransaction(account, accountData, amount, new Server(horizonURL), instructions, withdrawal)
  }

  const didRedirectToKYC = () => dispatch(Action.setDidRedirectToKYC())
  const afterSuccessfulExecution = (amount: BigNumber) => dispatch(Action.completed(amount))

  let consecutiveKYCPollErrors = 0

  const pollKYCStatus = async (withdrawal: Withdrawal, transferTxId: string, authToken?: string) => {
    if (window.navigator.onLine === false) {
      return
    }

    try {
      const { transaction } = await fetchTransaction(withdrawal.transferServer, transferTxId, "transfer", authToken)

      consecutiveKYCPollErrors = 0
      dispatch(Action.setTransferTransaction(transaction))

      if (transaction.status === TransferStatus.pending_user_transfer_start) {
        await requestWithdrawal(withdrawal, authToken, transaction as WithdrawalTransaction)
      }
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

  const actions = {
    afterSuccessfulExecution,
    didRedirectToKYC,
    navigateBack,
    performWebAuth,
    prepareWithdrawalTransaction,
    submitWithdrawalFieldValues,
    submitWithdrawalSelection
  }

  return {
    actions,
    nextState: machineState.next,
    prevStates: machineState.prevs,
    state: machineState.current
  }
}

export type WithdrawalActions = ReturnType<typeof useWithdrawalState>["actions"]

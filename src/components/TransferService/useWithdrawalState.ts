import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon, Memo, Networks, Operation, Server, Transaction, xdr } from "stellar-sdk"
import {
  fetchTransaction,
  fetchTransferInfos,
  KYCResponseType,
  TransferResultType,
  TransferServer,
  TransferStatus,
  Withdrawal,
  WithdrawalInstructionsSuccess,
  WithdrawalSuccessResponse
} from "@satoshipay/stellar-transfer"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useHorizonURL, useWebAuth } from "../../hooks/stellar"
import { useNetWorker } from "../../hooks/workers"
import { createTransaction, signTransaction } from "../../lib/transaction"
import { initialState, stateMachine, Action, WithdrawalAction, WithdrawalState, WithdrawalStates } from "./statemachine"
import { usePolling } from "./util"
import { WebauthData } from "@satoshipay/stellar-sep-10"

export interface WithdrawalMachineState<CurrentState extends WithdrawalState = WithdrawalState> {
  current: WithdrawalState
  next?: WithdrawalState
  prevs: WithdrawalState[]
}

const kycPollIntervalMs = 6000

const initialMachineState: WithdrawalMachineState<WithdrawalStates.SelectType> = {
  current: initialState,
  prevs: []
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
  const WebAuth = useWebAuth()

  const [machineState, dispatch] = React.useReducer(timeTravelingStateMachine, initialMachineState)

  const submitWithdrawalSelection = async (asset: Asset, method: string, transferServer: TransferServer) => {
    dispatch(Action.selectType(asset, method, transferServer))
  }

  const initiateWebAuth = async (withdrawal: Withdrawal) => {
    const { asset, transferServer } = withdrawal
    const webauthMetadata = await WebAuth.fetchWebAuthData(horizonURL, asset.issuer)

    if (!webauthMetadata) {
      throw Error(`Cannot initialize Stellar web authentication at ${transferServer.domain}`)
    }

    const cachedAuthToken = WebAuth.getCachedAuthToken(webauthMetadata.endpointURL, account.publicKey)

    return [webauthMetadata, cachedAuthToken] as const
  }

  const requestWithdrawal = async (withdrawal: Withdrawal, authToken?: string) => {
    const instructions = await withdrawal.interactive(authToken)

    if (instructions.type === TransferResultType.ok) {
      dispatch(Action.promptForTxDetails(withdrawal, instructions))
      stopKYCPolling()
    } else if (instructions.type === TransferResultType.kyc && instructions.subtype === KYCResponseType.interactive) {
      // sandbox.anchorusd.com seems to use `identifier` instead of `id`
      const transactionID = (instructions.data as any).id || (instructions.data as any).identifier
      startKYCPolling(() => pollKYCStatus(withdrawal, transactionID))
      dispatch(
        Action.conductKYC(
          withdrawal,
          instructions.data,
          "authToken" in machineState.current ? machineState.current.authToken : undefined
        )
      )
    } else {
      throw Error(`Unexpected response type: ${instructions.type} / ${instructions.data.type}`)
    }
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

    if (!withdraw.authentication_required) {
      return requestWithdrawal(withdrawal)
    }

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

  const afterSuccessfulExecution = (amount: BigNumber) => dispatch(Action.completed(amount))

  const pollKYCStatus = async (withdrawal: Withdrawal, transferTxId: string) => {
    if (window.navigator.onLine === false) {
      return
    }

    try {
      const authToken = "authToken" in machineState.current ? machineState.current.authToken : undefined
      const { transaction } = await fetchTransaction(withdrawal.transferServer, transferTxId, "transfer", authToken)

      if (transaction.status === TransferStatus.incomplete) {
        // Transfer transaction is still incomplete. Waiting for KYC to finish…
        return
      }

      await requestWithdrawal(withdrawal, authToken)
    } catch (error) {
      return trackError(error)
    }
  }

  const { isActive: isKYCPollingActive, start: startKYCPolling, stop: stopKYCPolling } = usePolling(kycPollIntervalMs)

  const navigateBack = () => {
    if (isKYCPollingActive) {
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

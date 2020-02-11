import BigNumber from "big.js"
import { Horizon, Memo, Networks, Operation, Server, Transaction, xdr } from "stellar-sdk"
import { WebauthData } from "@satoshipay/stellar-sep-10"
import {
  fetchTransferInfos,
  KYCResponseType,
  TransferResultType,
  TransferStatus,
  Withdrawal,
  WithdrawalInstructionsSuccess,
  WithdrawalSuccessResponse,
  WithdrawalTransaction
} from "@satoshipay/stellar-transfer"
import { Account } from "../../context/accounts"
import { useHorizonURL, useWebAuth } from "../../hooks/stellar"
import { useNetWorker } from "../../hooks/workers"
import { createTransaction } from "../../lib/transaction"
import { Action, TransferStates } from "./statemachine"
import { useTransferState } from "./useTransferState"

function createWithdrawal(state: Omit<TransferStates.EnterBasics, "step">): Withdrawal {
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

  const { dispatch, machineState, transfer } = useTransferState(account, closeDialog)

  const requestWithdrawal = async (withdrawal: Withdrawal, authToken?: string, transaction?: WithdrawalTransaction) => {
    const instructions = await withdrawal.interactive(authToken)

    if (instructions.type === TransferResultType.ok) {
      dispatch(Action.promptForTxDetails(undefined, withdrawal, instructions, transaction))
      transfer.stopKYCPolling()
    } else if (instructions.type === TransferResultType.kyc && instructions.subtype === KYCResponseType.interactive) {
      // sandbox.anchorusd.com seems to use `identifier` instead of `id`
      const transactionID = (instructions.data as any).id || (instructions.data as any).identifier

      if (!transfer.isKYCPollingActive()) {
        transfer.startKYCPolling(() => pollKYCStatus(withdrawal, transactionID, authToken))

        dispatch(
          Action.conductKYC(
            undefined,
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
    deposit: undefined, // Just in here to match the same method in useDepositState()
    withdrawal: Withdrawal,
    webauthMetadata: WebauthData,
    challenge: Transaction,
    password: string | null
  ) => {
    const authToken = await transfer.performWebAuth(webauthMetadata, challenge, password)
    await requestWithdrawal(withdrawal, authToken)

    return authToken
  }

  const submitTransferFieldValues = async (details: Omit<TransferStates.EnterBasics, "step">) => {
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

    const [webauth, cachedAuthToken] = await transfer.submitTransferFieldValues(details)

    if (cachedAuthToken) {
      await requestWithdrawal(withdrawal, cachedAuthToken)
    } else {
      const network = account.testnet ? Networks.TESTNET : Networks.PUBLIC
      const authChallenge = await WebAuth.fetchChallenge(
        webauth.endpointURL,
        webauth.signingKey,
        account.publicKey,
        network
      )
      dispatch(Action.conductAuth(undefined, withdrawal, webauth, authChallenge))
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

  const pollKYCStatus = async (withdrawal: Withdrawal, transferTxId: string, authToken?: string) => {
    const transaction = await transfer.pollKYCStatus(withdrawal.transferServer, transferTxId, authToken)

    if (transaction && transaction.status === TransferStatus.pending_user_transfer_start) {
      await requestWithdrawal(withdrawal, authToken, transaction as WithdrawalTransaction)
    }
  }

  const actions = {
    afterSuccessfulExecution: transfer.afterSuccessfulExecution,
    didRedirectToKYC: transfer.didRedirectToKYC,
    navigateBack: transfer.navigateBack,
    performWebAuth,
    prepareWithdrawalTransaction,
    submitTransferFieldValues,
    submitTransferSelection: transfer.submitTransferSelection
  }

  return {
    actions,
    nextState: machineState.next,
    prevStates: machineState.prevs,
    state: machineState.current
  }
}

export type WithdrawalActions = ReturnType<typeof useWithdrawalState>["actions"]

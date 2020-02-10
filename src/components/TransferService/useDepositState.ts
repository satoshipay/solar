import { Networks, Transaction } from "stellar-sdk"
import { WebauthData } from "@satoshipay/stellar-sep-10"
import {
  fetchTransferInfos,
  Deposit,
  DepositInstructionsSuccess,
  DepositSuccessResponse,
  DepositTransaction,
  KYCResponseType,
  TransferResultType,
  TransferStatus
} from "@satoshipay/stellar-transfer"
import { Account } from "../../context/accounts"
import { useHorizonURL, useWebAuth } from "../../hooks/stellar"
import { useNetWorker } from "../../hooks/workers"
import { Action, TransferStates } from "./statemachine"
import { useTransferState } from "./useTransferState"

function createDeposit(account: Account, state: Omit<TransferStates.EnterBasics, "step">): Deposit {
  const fields = {
    ...(state.formValues as Record<string, string>),
    type: state.method
  }
  return Deposit(state.transferServer, state.asset, account.publicKey, fields)
}

export function useDepositState(account: Account, closeDialog: () => void) {
  const WebAuth = useWebAuth()

  const { dispatch, machineState, transfer } = useTransferState(account, closeDialog)

  const selectXLMDeposit = () => {
    dispatch(Action.selectXLMDeposit())
  }

  const requestDeposit = async (deposit: Deposit, authToken?: string, transaction?: DepositTransaction) => {
    const instructions = await deposit.interactive(authToken)

    if (instructions.type === TransferResultType.ok) {
      dispatch(Action.promptForTxDetails(deposit, undefined as any, instructions, transaction))
      transfer.stopKYCPolling()
    } else if (instructions.type === TransferResultType.kyc && instructions.subtype === KYCResponseType.interactive) {
      // sandbox.anchorusd.com seems to use `identifier` instead of `id`
      const transactionID = (instructions.data as any).id || (instructions.data as any).identifier

      if (!transfer.isKYCPollingActive()) {
        transfer.startKYCPolling(() => pollKYCStatus(deposit, transactionID, authToken))

        dispatch(
          Action.conductKYC(
            deposit,
            undefined,
            instructions,
            "authToken" in machineState.current ? machineState.current.authToken : undefined
          )
        )

        // Poll status immediately in case the withdrawal is already pending
        pollKYCStatus(deposit, transactionID, authToken)
      }
    } else {
      throw Error(`Unexpected response type: ${instructions.type} / ${instructions.data.type}`)
    }

    return instructions
  }

  const performWebAuth = async (
    deposit: Deposit,
    withdrawal: undefined, // Just in here to match the same method in useWithdrawalState()
    webauthMetadata: WebauthData,
    challenge: Transaction,
    password: string | null
  ) => {
    const authToken = await transfer.performWebAuth(webauthMetadata, challenge, password)
    await requestDeposit(deposit, authToken)

    return authToken
  }

  const submitTransferFieldValues = async (details: Omit<TransferStates.EnterBasics, "step">) => {
    const infos = await fetchTransferInfos(details.transferServer)
    const assetInfo = infos.assets.find(info => info.asset.equals(details.asset))
    const withdraw = assetInfo && assetInfo.withdraw

    if (!withdraw || !withdraw.enabled) {
      throw Error(`Asset ${details.asset.code} seems to not be withdrawable via ${details.transferServer.domain}`)
    }

    const deposit = createDeposit(account, details)
    const [webauth, cachedAuthToken] = await transfer.submitTransferFieldValues(details)

    if (cachedAuthToken) {
      await requestDeposit(deposit, cachedAuthToken)
    } else {
      const network = account.testnet ? Networks.TESTNET : Networks.PUBLIC
      const authChallenge = await WebAuth.fetchChallenge(
        webauth.endpointURL,
        webauth.signingKey,
        account.publicKey,
        network
      )
      dispatch(Action.conductAuth(deposit, undefined, webauth, authChallenge))
    }
  }

  const pollKYCStatus = async (deposit: Deposit, transferTxId: string, authToken?: string) => {
    const transaction = await transfer.pollKYCStatus(deposit.transferServer, transferTxId, authToken)

    if (transaction && transaction.status === TransferStatus.pending_user_transfer_start) {
      await requestDeposit(deposit, authToken, transaction as DepositTransaction)
    }
  }

  const actions = {
    afterSuccessfulExecution: transfer.afterSuccessfulExecution,
    didRedirectToKYC: transfer.didRedirectToKYC,
    navigateBack: transfer.navigateBack,
    performWebAuth,
    selectXLMDeposit,
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

export type DepositActions = ReturnType<typeof useDepositState>["actions"]

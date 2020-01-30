import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon, Memo, Networks, Operation, Server, Transaction, xdr } from "stellar-sdk"
import {
  fetchTransaction,
  fetchTransferInfos,
  openTransferServer,
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
import { Action, initialState, stateMachine, WithdrawalStates } from "./statemachine"
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

function createWithdrawal(state: Omit<WithdrawalStates.EnterBasics, "step">): Withdrawal {
  return Withdrawal(state.transferServer, state.asset, state.formValues as Record<string, string>)
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

export function useWithdrawalState(account: Account) {
  const netWorker = useNetWorker()
  const horizonURL = useHorizonURL(account.testnet)
  const WebAuth = useWebAuth()

  const [currentState, dispatch] = React.useReducer(stateMachine, initialState)

  const submitWithdrawalSelection = async (asset: Asset, method: string) => {
    const issuerAccount = await netWorker.fetchAccountData(horizonURL, asset.issuer)
    if (!issuerAccount) {
      throw Error(`Cannot resolve account data of issuing account ${asset.issuer} of asset ${asset.code}.`)
    }

    const domain = issuerAccount.home_domain
    if (!domain) {
      throw Error(`Cannot resolve issuing account home domain: ${asset.issuer} of asset ${asset.code}`)
    }

    const transferServer = await openTransferServer(domain, account.testnet ? Networks.TESTNET : Networks.PUBLIC, {
      walletName: "Solar",
      walletURL: "https://solarwallet.io"
    })

    dispatch(Action.selectType(asset, method, transferServer))
  }

  const performWebAuth = async (asset: Asset, domain: string, password: string) => {
    const webauthMetadata = await WebAuth.fetchWebAuthData(horizonURL, asset.issuer)
    if (!webauthMetadata) {
      throw Error(`Cannot initialize Stellar web authentication at ${domain}`)
    }

    const cachedAuthToken = WebAuth.getCachedAuthToken(webauthMetadata.endpointURL, account.publicKey)
    if (cachedAuthToken) {
      dispatch(Action.setAuthToken(cachedAuthToken))
      return cachedAuthToken
    }

    const challenge = await WebAuth.fetchChallenge(
      webauthMetadata.endpointURL,
      webauthMetadata.signingKey,
      account.publicKey
    )

    const transaction = await signTransaction(challenge, account, password)
    const authToken = await WebAuth.postResponse(webauthMetadata.endpointURL, transaction, account.testnet)

    dispatch(Action.setAuthToken(authToken))
    return authToken
  }

  const requestWithdrawal = async (withdrawal: Withdrawal, amount: BigNumber, authToken?: string) => {
    const instructions = await withdrawal.interactive(authToken)
    const accountData = await netWorker.fetchAccountData(horizonURL, account.publicKey)

    if (!accountData) {
      throw Error(`Cannot fetch account data of ${account.publicKey} from ${horizonURL}`)
    }

    if (instructions.type === TransferResultType.ok) {
      const transaction = await createWithdrawalTransaction(
        account,
        accountData,
        amount,
        new Server(horizonURL),
        instructions,
        withdrawal
      )
      dispatch(Action.waitForStellarTx(instructions, transaction))
      stopKYCPolling()
    } else if (instructions.type === TransferResultType.kyc && instructions.subtype === KYCResponseType.interactive) {
      // sandbox.anchorusd.com seems to use `identifier` instead of `id`
      const transactionID = (instructions.data as any).id || (instructions.data as any).identifier
      startKYCPolling(() => pollKYCStatus(withdrawal, amount, transactionID, authToken))
      dispatch(
        Action.conductKYC(
          withdrawal,
          instructions.data,
          "authToken" in currentState ? currentState.authToken : undefined
        )
      )
    } else {
      throw Error(`Unexpected response type: ${instructions.type} / ${instructions.data.type}`)
    }
  }

  const submitWithdrawalFieldValues = async (
    amount: BigNumber,
    details: Omit<WithdrawalStates.EnterBasics, "step">
  ) => {
    dispatch(Action.captureWithdrawalInput(details.formValues))

    const infos = await fetchTransferInfos(details.transferServer)
    const assetInfo = infos.assets.find(info => info.asset.equals(details.asset))
    const withdraw = assetInfo && assetInfo.withdraw

    if (!withdraw || !withdraw.enabled) {
      throw Error(`Asset ${details.asset.code} seems to not be withdrawable via ${details.transferServer.domain}`)
    }

    const withdrawal = createWithdrawal(details)

    if (withdraw.authentication_required) {
      dispatch(Action.conductAuth(withdrawal))
    } else {
      await requestWithdrawal(withdrawal, amount)
    }
  }

  const afterSuccessfulExecution = () => dispatch(Action.completed())

  const pollKYCStatus = async (withdrawal: Withdrawal, amount: BigNumber, transferTxId: string, authToken?: string) => {
    if (window.navigator.onLine === false) {
      return
    }

    try {
      const authToken = "authToken" in currentState ? currentState.authToken : undefined
      const { transaction } = await fetchTransaction(withdrawal.transferServer, transferTxId, "transfer", authToken)

      if (transaction.status === TransferStatus.incomplete) {
        // Transfer transaction is still incomplete. Waiting for KYC to finish…
        return
      }

      await requestWithdrawal(withdrawal, amount, authToken)
    } catch (error) {
      return trackError(error)
    }
  }

  const { isActive: isKYCPollingActive, start: startKYCPolling, stop: stopKYCPolling } = usePolling(kycPollIntervalMs)

  const navigateBack = () => {
    if (isKYCPollingActive) {
      stopKYCPolling()
    }
    dispatch(Action.navigateBack())
  }

  const actions = {
    afterSuccessfulExecution,
    navigateBack,
    performWebAuth,
    submitWithdrawalFieldValues,
    submitWithdrawalSelection
  }

  return {
    actions,
    state: currentState
  }
}

interface TxSubmissionResponse {
  data: any
  status: number
}

function explainSubmissionErrorByOpResultCodes(response: TxSubmissionResponse, resultCodes: string[]) {
  // tslint:disable-next-line prefer-object-spread
  const augment = (error: Error) => Object.assign(error, { response })

  // See <https://github.com/stellar/horizon/blob/master/src/github.com/stellar/horizon/codes/main.go>
  const errorCodes = resultCodes.filter(code => code !== "op_success")

  if (errorCodes.length === 1) {
    switch (errorCodes[0]) {
      case "op_cross_self":
        return augment(Error("The order would counter an open order of yours."))
      case "op_has_sub_entries":
        return augment(Error("Account still has trustlines (assets) or open trading orders."))
      case "op_immutable_set":
        return augment(Error("Account is immutable (AUTH_IMMUTABLE flag set)."))
      case "op_line_full":
        return augment(Error("The destination account's balance would exceed the destination's trust in the asset."))
      case "op_low_reserve":
        return augment(
          Error(
            "Transaction rejected by the network. Source or destination account balance would be below minimum balance."
          )
        )
      case "op_no_account":
        return augment(Error("Destination account does not exist."))
      case "op_no_issuer":
        return augment(Error("Asset is invalid. Incorrect asset issuer."))
      case "op_no_trust":
        return augment(Error("Destination account does not trust the asset you are attempting to send."))
      case "op_underfunded":
        return augment(Error("Not enough funds to perform this operation."))
    }
  }

  return augment(Error(`Transaction rejected by the network. Operation error codes: ${errorCodes.join(", ")}`))
}

function explainSubmissionErrorByTxResultCode(response: TxSubmissionResponse, resultCode: string) {
  // tslint:disable-next-line prefer-object-spread
  const augment = (error: Error) => Object.assign(error, { response })

  // See <https://github.com/stellar/horizon/blob/master/src/github.com/stellar/horizon/codes/main.go>
  // See <https://www.stellar.org/developers/guides/concepts/transactions.html#possible-errors>
  switch (resultCode) {
    case "insufficient_fee":
      return augment(Error("Network demands higher fees than set in the transaction."))
    case "internal_error":
      return augment(Error("An unknown error occured on the Stellar server."))
    case "no_account":
      return augment(Error("Source account not found."))
    case "tx_bad_auth":
      return augment(Error("Too few valid signatures or wrong network."))
    case "tx_bad_auth_extra":
      return augment(Error("Unused signatures attached to transaction."))
    case "tx_bad_seq":
      return augment(Error("Sequence number mismatch. Please re-create the transaction."))
    case "tx_insufficient_balance":
      return augment(Error("Insufficient balance. Balance would fall below the minimum reserve."))
    case "tx_too_late":
      return augment(Error("Transaction draft has expired. Try again."))
    default:
      return augment(Error(`Transaction rejected by the network. Result code: ${resultCode}`))
  }
}

export function explainSubmissionErrorResponse(response: TxSubmissionResponse | undefined) {
  if (!response || response.status !== 400) {
    return Error("An unknown error occured.")
  }

  if (response.data && response.data.extras && response.data.extras.result_codes) {
    const resultCodes = response.data.extras.result_codes

    if (resultCodes.operations && resultCodes.operations.length > 0) {
      return explainSubmissionErrorByOpResultCodes(response, resultCodes.operations)
    } else if (resultCodes.transaction) {
      return explainSubmissionErrorByTxResultCode(response, resultCodes.transaction)
    }

    // TODO: Handle more result codes
  }

  return Error("An unknown error occured.")
}

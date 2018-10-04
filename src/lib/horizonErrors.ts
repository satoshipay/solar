interface HorizonRequestConfig {
  url: string
  // (incomplete)
}

interface HorizonResponse {
  config: HorizonRequestConfig
  data: any
  headers: { [headerName: string]: string }
  request: XMLHttpRequest
  status: number
  statusText: string
}

interface HorizonError extends Error {
  config: HorizonRequestConfig
  request: XMLHttpRequest
  response: HorizonResponse
}

function deriveError(originalError: HorizonError, newError: Error) {
  // Copy debugging metadata to the new error for future inspection
  // Use `Object.assign()` instead of object spread operator to preserve prototype
  // tslint:disable-next-line
  return Object.assign(newError, {
    config: originalError.config,
    request: originalError.request,
    response: originalError.response
  })
}

function explainSubmissionErrorByOpResultCodes(error: HorizonError, resultCodes: string[]) {
  // See <https://github.com/stellar/horizon/blob/master/src/github.com/stellar/horizon/codes/main.go>
  const errorCodes = resultCodes.filter(code => code !== "op_success")

  if (errorCodes.length === 1) {
    switch (errorCodes[0]) {
      case "op_line_full":
        return deriveError(
          error,
          new Error("The destination account's balance would exceed the destination's trust in the asset.")
        )
      case "op_low_reserve":
        return deriveError(
          error,
          new Error(
            "Transaction rejected by the network. Source or destination account balance would be below minimum balance."
          )
        )
      case "op_no_issuer":
        return deriveError(error, new Error("Asset is invalid. Incorrect asset issuer."))
      case "op_no_trust":
        return deriveError(error, new Error("Destination account does not trust the asset you are attempting to send."))
    }
  }

  return deriveError(
    error,
    new Error(`Transaction rejected by the network. Operation error codes: ${errorCodes.join(", ")}`)
  )
}

function explainSubmissionErrorByTxResultCode(error: HorizonError, resultCode: string) {
  // See <https://github.com/stellar/horizon/blob/master/src/github.com/stellar/horizon/codes/main.go>
  switch (resultCode) {
    case "tx_bad_auth":
      return deriveError(error, new Error("Transaction authentication failed."))
    case "tx_bad_seq":
      return deriveError(error, new Error("Sequence number mismatch. Please try again."))
    case "tx_insufficient_balance":
      return deriveError(error, new Error("Insufficient balance."))
    default:
      return deriveError(error, new Error(`Transaction rejected by the network. Result code: ${resultCode}`))
  }
}

export function explainSubmissionError(error: any) {
  if (!error.response || error.response.status !== 400) {
    return error
  }

  const response: HorizonResponse = (error as HorizonError).response

  if (response.data && response.data.extras && response.data.extras.result_codes) {
    const resultCodes = response.data.extras.result_codes

    if (resultCodes.operations && resultCodes.operations.length > 0) {
      return explainSubmissionErrorByOpResultCodes(error, resultCodes.operations)
    } else if (resultCodes.transaction) {
      return explainSubmissionErrorByTxResultCode(error, resultCodes.transaction)
    }

    // TODO: Handle more result codes
  }

  return error
}

import { TFunction } from "i18next"
import { CustomError } from "./errors"

interface TxSubmissionResponse {
  data: any
  status: number
}

// See <https://github.com/stellar/horizon/blob/master/src/github.com/stellar/horizon/codes/main.go>
// See <https://www.stellar.org/developers/guides/concepts/transactions.html#possible-errors>
export function explainSubmissionErrorResponse(response: TxSubmissionResponse | undefined, t: TFunction) {
  if (!response) {
    return CustomError("UnknownError", t("generic.error.unknown-error"))
  }

  // tslint:disable-next-line prefer-object-spread
  const augment = (error: Error) => Object.assign(error, { response })

  if (response.status === 400 && response.data && response.data.extras && response.data.extras.result_codes) {
    const resultCodes = response.data.extras.result_codes

    if (resultCodes.operations && resultCodes.operations.length > 0) {
      const errorCodes = resultCodes.operations.filter((code: string) => code !== "op_success")
      return augment(
        Error(
          t(
            `generic.error.submission-error.op-result-code.${errorCodes[0]}`,
            t("generic.error.submission-error.default", {
              codes: errorCodes.join(", ")
            })
          )
        )
      )
    } else if (resultCodes.transaction) {
      return augment(
        Error(
          t(
            `generic.error.submission-error.tx-result-code.${resultCodes.transaction}`,
            t("generic.error.submission-error.default", {
              codes: resultCodes.transaction
            })
          )
        )
      )
    }
    // TODO: Handle more result codes
  } else if (response.status === 500) {
    return augment(Error(t("generic.error.submission-error.internal-server-error")))
  } else if (response.status === 504) {
    return augment(Error(t("generic.error.submission-error.timeout")))
  }

  return CustomError("UnknownError", t("generic.error.unknown-error"))
}

import { TFunction } from "i18next"

interface TxSubmissionResponse {
  data: any
  status: number
}

// See <https://github.com/stellar/horizon/blob/master/src/github.com/stellar/horizon/codes/main.go>
// See <https://www.stellar.org/developers/guides/concepts/transactions.html#possible-errors>
export function explainSubmissionErrorResponse(response: TxSubmissionResponse | undefined, t: TFunction) {
  if (!response || response.status !== 400) {
    return Error(t("error.unknown"))
  }

  if (response.data && response.data.extras && response.data.extras.result_codes) {
    // tslint:disable-next-line prefer-object-spread
    const augment = (error: Error) => Object.assign(error, { response })
    const resultCodes = response.data.extras.result_codes

    if (resultCodes.operations && resultCodes.operations.length > 0) {
      const errorCodes = resultCodes.operations.filter((code: string) => code !== "op_success")
      return augment(
        Error(
          t(`error.submission-error.op-result-code.${errorCodes[0]}`, "error.submission-error.default", {
            codes: errorCodes.join(", ")
          })
        )
      )
    } else if (resultCodes.transaction) {
      return augment(
        Error(
          t(`error.submission-error.op-result-code.${resultCodes.transaction}`, "error.submission-error.default", {
            codes: resultCodes.transaction
          })
        )
      )
    }

    // TODO: Handle more result codes
  }

  return Error(t("error.unknown"))
}

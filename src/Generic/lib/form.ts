import BigNumber, { BigSource } from "big.js"

export const isValidAmount = (amount: string) => /^[0-9]*([\.,][0-9]+)?$/.test(amount)

// replaces ',' with '.' in a string
export function replaceCommaWithDot(input: string) {
  return input.replace(/,/g, ".")
}

// should be used when creating a Big from user input because there are issues with
// parsing a Big from number-strings with a comma on iOS
export function FormBigNumber(value: BigSource) {
  if (typeof value === "string") {
    return BigNumber(replaceCommaWithDot(value))
  } else {
    return BigNumber(value)
  }
}

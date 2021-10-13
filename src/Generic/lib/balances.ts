import BigNumber from "big.js"
import { Horizon } from "stellar-sdk"
import { BalanceLine } from "./account"

function addThousandsSeparators(digits: string, thousandsSeparator: string) {
  const digitGroups: string[] = []

  while (digits.length > 0) {
    digitGroups.push(digits.substr(-3))
    digits = digits.substr(0, digits.length - 3)
  }

  return digitGroups.reverse().join(thousandsSeparator)
}

function trimBalance(balance: BigNumber): string {
  if (balance.eq(0)) {
    return "0"
  } else if (balance.round().eq(balance)) {
    return balance.toFixed(2)
  } else {
    return balance.toFixed(7)
  }
}

export interface BalanceFormattingOptions {
  groupThousands?: boolean
  maximumDecimals?: number
  maximumSignificants?: number
  minimumDecimals?: number
  minimumSignificants?: number
}

export function formatBalance(input: BigNumber | string, options: BalanceFormattingOptions = {}) {
  if (typeof input === "string" && Number.isNaN(Number.parseFloat(input))) {
    return "-"
  }

  const balance = BigNumber(input)
  const thousandsSeparator = ","
  const {
    groupThousands = true,
    maximumDecimals = 7,
    maximumSignificants = 13,
    minimumDecimals = 0,
    minimumSignificants = 0
  } = options

  const trimmedUnformattedBalance = trimBalance(balance.abs())

  // tslint:disable-next-line prefer-const
  let [integerPart, decimalPart = ""] = trimmedUnformattedBalance.split(".")

  if (decimalPart.length < minimumDecimals) {
    decimalPart += "0".repeat(minimumDecimals - decimalPart.length)
  } else if (decimalPart.length > maximumDecimals) {
    decimalPart = decimalPart.substr(0, maximumDecimals)
  }
  if (integerPart.length + decimalPart.length < minimumSignificants) {
    decimalPart += "0".repeat(minimumSignificants - integerPart.length - decimalPart.length)
  }
  if (integerPart.length + decimalPart.length > maximumSignificants && decimalPart.length > 0) {
    decimalPart = decimalPart.substr(0, maximumSignificants - integerPart.length)
  }

  return (
    (groupThousands ? addThousandsSeparators(integerPart, thousandsSeparator) : integerPart) +
    (decimalPart ? "." + decimalPart : "")
  )
}

export function sortBalances(balances: BalanceLine[]) {
  const sorter = (balance1: Horizon.BalanceLineAsset, balance2: Horizon.BalanceLineAsset) => {
    if (Number.parseFloat(balance1.balance) === 0 && Number.parseFloat(balance2.balance) !== 0) {
      return 1
    } else if (Number.parseFloat(balance1.balance) !== 0 && Number.parseFloat(balance2.balance) === 0) {
      return -1
    }

    return balance1.asset_code === balance2.asset_code ? 0 : balance1.asset_code < balance2.asset_code ? -1 : 1
  }

  const nativeBalance = balances.find(balance => balance.asset_type === "native")

  return [
    ...balances.filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native").sort(sorter),
    ...(nativeBalance ? [nativeBalance] : [])
  ]
}

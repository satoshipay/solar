import BigNumber from "big.js"
import { Asset, Horizon } from "stellar-sdk"
import { AccountData } from "~Generic/lib/account"
import { formatBalance, BalanceFormattingOptions } from "~Generic/lib/balances"
import { FormBigNumber, isValidAmount } from "~Generic/lib/form"
import { calculateSpread, FixedOrderbookRecord } from "~Generic/lib/orderbook"
import { BASE_RESERVE, balancelineToAsset, getAccountMinimumBalance, getSpendableBalance } from "~Generic/lib/stellar"
import { useConversionOffers } from "./conversion"

export const bigNumberToInputValue = (bignum: BigNumber, overrides?: BalanceFormattingOptions) =>
  formatBalance(bignum, { minimumSignificants: 3, maximumSignificants: 9, groupThousands: false, ...overrides })

function findMatchingBalance(balances: AccountData["balances"], asset: Asset) {
  return balances.find(balance => balancelineToAsset(balance).equals(asset))
}

function getSpendableBalanceWithoutBaseReserve(accountMinimumBalance: BigNumber, balanceLine: Horizon.BalanceLine) {
  const spendableBalance = getSpendableBalance(accountMinimumBalance, balanceLine).minus(
    // subtract base-reserve when asset_type is native because placing a new order requires 1 * base-reserve XLM
    BigNumber(balanceLine.asset_type === "native" ? BASE_RESERVE : BigNumber(0))
  )

  // return 0 if calculated balance is negative
  return spendableBalance.cmp(BigNumber(0)) < 0 ? BigNumber(0) : spendableBalance
}

export interface TradingFormValues {
  primaryAsset: Asset | undefined
  primaryAmountString: string
  secondaryAsset: Asset
  manualPrice: string
}

interface CalculationParameters {
  accountData: AccountData
  priceMode: "primary" | "secondary"
  primaryAction: "buy" | "sell"
  tradePair: FixedOrderbookRecord
  values: TradingFormValues
}

interface CalculationResults {
  defaultPrice: string
  effectivePrice: BigNumber
  maxPrimaryAmount: BigNumber
  minAccountBalance: BigNumber
  primaryAmount: BigNumber
  primaryBalance: Horizon.BalanceLine | undefined
  relativeSpread: number
  secondaryAmount: BigNumber
  secondaryBalance: Horizon.BalanceLine | undefined
  spendablePrimaryBalance: BigNumber
  spendableSecondaryBalance: BigNumber
}

export function useCalculation(parameters: CalculationParameters): CalculationResults {
  const { accountData, priceMode, primaryAction, tradePair } = parameters
  const { manualPrice, primaryAmountString, primaryAsset, secondaryAsset } = parameters.values

  const price =
    manualPrice && isValidAmount(manualPrice)
      ? priceMode === "secondary"
        ? FormBigNumber(manualPrice)
        : FormBigNumber(manualPrice).eq(0) // prevent division by zero
        ? BigNumber(0)
        : BigNumber(1).div(FormBigNumber(manualPrice))
      : BigNumber(0)

  const primaryAmount =
    primaryAmountString && isValidAmount(primaryAmountString) ? FormBigNumber(primaryAmountString) : BigNumber(0)

  const primaryBalance = primaryAsset ? findMatchingBalance(accountData.balances, primaryAsset) : undefined
  const secondaryBalance = secondaryAsset ? findMatchingBalance(accountData.balances, secondaryAsset) : undefined

  const { worstPriceOfBestMatches } = useConversionOffers(
    primaryAction === "buy" ? tradePair.asks : tradePair.bids,
    primaryAmount.gt(0) ? primaryAmount : BigNumber(0.01),
    primaryAction === "sell"
  )

  const { relativeSpread } = calculateSpread(tradePair.asks, tradePair.bids)
  const bestPrice = worstPriceOfBestMatches && worstPriceOfBestMatches.gt(0) ? worstPriceOfBestMatches : undefined
  const effectivePrice = price.gt(0) ? price : bestPrice || BigNumber(0)
  const secondaryAmount = primaryAmount.mul(effectivePrice)

  // prevent division by zero
  const inversePrice = effectivePrice.eq(0) ? BigNumber(0) : BigNumber(1).div(effectivePrice)
  const defaultPrice = bigNumberToInputValue(priceMode === "secondary" ? effectivePrice : inversePrice)

  const minAccountBalance = getAccountMinimumBalance(accountData)

  const spendablePrimaryBalance = primaryBalance
    ? primaryAction === "sell"
      ? getSpendableBalanceWithoutBaseReserve(minAccountBalance, primaryBalance)
      : getSpendableBalance(minAccountBalance, primaryBalance)
    : BigNumber(0)

  const spendableSecondaryBalance = secondaryBalance
    ? primaryAction === "buy"
      ? getSpendableBalanceWithoutBaseReserve(minAccountBalance, secondaryBalance)
      : getSpendableBalance(minAccountBalance, secondaryBalance)
    : BigNumber(0)

  const maxPrimaryAmount =
    primaryAction === "buy"
      ? spendableSecondaryBalance.gt(0) && effectivePrice.gt(0)
        ? BigNumber(spendableSecondaryBalance).div(effectivePrice)
        : BigNumber(0)
      : spendablePrimaryBalance.gt(0)
      ? BigNumber(spendablePrimaryBalance)
      : BigNumber(0)

  return {
    defaultPrice,
    effectivePrice,
    maxPrimaryAmount,
    minAccountBalance,
    primaryAmount,
    primaryBalance,
    relativeSpread,
    secondaryAmount,
    secondaryBalance,
    spendablePrimaryBalance,
    spendableSecondaryBalance
  }
}

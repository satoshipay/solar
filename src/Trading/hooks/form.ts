import BigNumber from "big.js"
import { Asset, Horizon } from "stellar-sdk"
import { formatBalance, BalanceFormattingOptions } from "~Account/components/AccountBalances"
import { AccountData } from "~Generic/lib/account"
import { calculateSpread, FixedOrderbookRecord } from "~Generic/lib/orderbook"
import { balancelineToAsset, getAccountMinimumBalance } from "~Generic/lib/stellar"
import { useConversionOffers } from "./conversion"

export const bigNumberToInputValue = (bignum: BigNumber, overrides?: BalanceFormattingOptions) =>
  formatBalance(bignum, { minimumSignificants: 3, maximumSignificants: 9, ...overrides })

export const isValidAmount = (amount: string) => /^[0-9]+([\.,][0-9]+)?$/.test(amount)

function findMatchingBalance(balances: AccountData["balances"], asset: Asset) {
  return balances.find(balance => balancelineToAsset(balance).equals(asset))
}

export interface TradingFormValues {
  primaryAsset: Asset | undefined
  primaryAmountString: string
  secondaryAsset: Asset
  manualPrice: string
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

export function useCalculation(
  values: TradingFormValues,
  tradePair: FixedOrderbookRecord,
  priceMode: "primary" | "secondary",
  accountData: AccountData,
  primaryAction: "buy" | "sell"
): CalculationResults {
  const { manualPrice, primaryAmountString, primaryAsset, secondaryAsset } = values

  const price =
    manualPrice && isValidAmount(manualPrice)
      ? priceMode === "secondary"
        ? BigNumber(manualPrice)
        : BigNumber(manualPrice).eq(0) // prevent division by zero
        ? BigNumber(0)
        : BigNumber(1).div(manualPrice)
      : BigNumber(0)

  const primaryAmount =
    primaryAmountString && isValidAmount(primaryAmountString) ? BigNumber(primaryAmountString) : BigNumber(0)

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
    ? BigNumber(primaryBalance.balance).sub(primaryBalance.asset_type === "native" ? minAccountBalance : 0)
    : BigNumber(0)

  const spendableSecondaryBalance = secondaryBalance
    ? BigNumber(secondaryBalance.balance).sub(secondaryBalance.asset_type === "native" ? minAccountBalance : 0)
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

import BigNumber from "big.js"
import React from "react"
import { Asset, AssetType, Horizon } from "stellar-sdk"
import { useLiveOrderbook } from "../../hooks/stellar-subscriptions"
import { calculateSpread } from "../../lib/orderbook"
import { Box, VerticalLayout } from "../Layout/Box"
import { warningColor } from "../../theme"
import { useConversionOffers } from "./hooks"
import TradePropertiesForm from "./TradePropertiesForm"

function isDisabled(amount: BigNumber, price: BigNumber, balance: BigNumber) {
  return [amount.lte(0), amount.gt(balance), price.lte(0)].some(condition => condition === true)
}

interface DialogActionsProps {
  amount: BigNumber
  disabled?: boolean
  price: BigNumber
  style?: React.CSSProperties
}

interface Props {
  buying: Asset
  buyingBalance: string
  onSetBuying: (asset: Asset) => void
  onSetSelling: (asset: Asset) => void
  selling: Asset
  sellingBalance: string
  testnet: boolean
  trustlines: Array<Horizon.BalanceLineAsset<AssetType.credit4 | AssetType.credit12>>
  DialogActions: React.ComponentType<DialogActionsProps>
}

function TradingForm(props: Props) {
  const DialogActions = props.DialogActions
  const tradePair = useLiveOrderbook(props.selling, props.buying, props.testnet)

  const [amountString, setAmountString] = React.useState("")
  const [manualPrice, setManualPrice] = React.useState<BigNumber | undefined>()
  const [priceMode, setPriceMode] = React.useState<"fixed-buying" | "fixed-selling">("fixed-selling")

  const togglePriceMode = React.useCallback(
    () => setPriceMode(prev => (prev === "fixed-buying" ? "fixed-selling" : "fixed-buying")),
    []
  )

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? BigNumber(0) : BigNumber(amountString)

  const { estimatedReturn, worstPriceOfBestMatches } = useConversionOffers(
    tradePair.bids,
    amount.gt(0) ? amount : BigNumber(0.01)
  )

  const bestPrice = worstPriceOfBestMatches && worstPriceOfBestMatches.gt(0) ? worstPriceOfBestMatches : undefined

  const price = manualPrice || bestPrice || BigNumber(0)
  const { relativeSpread } = calculateSpread(tradePair.asks, tradePair.bids)

  return (
    <VerticalLayout alignItems="stretch" alignSelf="center" grow={1} shrink={1} maxWidth={500} width="100%">
      <TradePropertiesForm
        {...props}
        amount={amountString}
        estimatedReturn={estimatedReturn}
        manualPrice={manualPrice}
        priceMode={priceMode}
        onSetAmount={setAmountString}
        onSetManualPrice={setManualPrice}
        onTogglePriceMode={togglePriceMode}
        price={price}
      />
      {relativeSpread > 0.01 ? (
        <Box padding="8px 12px" style={{ background: warningColor }}>
          <b>Warning</b>
          <br />
          Large spread ({(relativeSpread * 100).toFixed(1)}
          %) between buying and selling price. Converting the funds back might be expensive.
        </Box>
      ) : null}
      <DialogActions
        amount={amount}
        disabled={amountString === "" || isDisabled(amount, price, BigNumber(props.sellingBalance))}
        price={price}
        style={{ justifySelf: "flex-end" }}
      />
    </VerticalLayout>
  )
}

export default React.memo(TradingForm)

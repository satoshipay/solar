import BigNumber from "big.js"
import React from "react"
import { Asset, AssetType, Horizon } from "stellar-sdk"
import { useLiveOrderbook } from "../../hooks/stellar-subscriptions"
import { calculateSpread } from "../../lib/orderbook"
import { Box, VerticalLayout } from "../Layout/Box"
import { warningColor } from "../../theme"
import { useConversionOffers } from "./hooks"
import TradePropertiesForm from "./TradePropertiesForm"

interface Amounts {
  buying: BigNumber
  price: BigNumber | undefined
  selling: BigNumber
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
  onSelectAssets: (assets: { buying: Asset; selling: Asset }) => void
  selling: Asset
  sellingBalance: string
  testnet: boolean
  trustlines: Array<Horizon.BalanceLineAsset<AssetType.credit4 | AssetType.credit12>>
  DialogActions: React.ComponentType<DialogActionsProps>
}

function TradingForm(props: Props) {
  const DialogActions = props.DialogActions
  const tradePair = useLiveOrderbook(props.selling, props.buying, props.testnet)

  const [amounts, setAmounts] = React.useState<Amounts>(() => ({
    buying: BigNumber(0),
    price: undefined,
    selling: BigNumber(0)
  }))

  const { estimatedReturn, worstPriceOfBestMatches } = useConversionOffers(
    tradePair.bids,
    amounts.selling.gt(0) ? amounts.selling : BigNumber(0.01)
  )

  const getPrice = (manualPrice: BigNumber | undefined, autoPrice?: BigNumber) =>
    manualPrice || autoPrice || BigNumber(0)

  const bestPrice = worstPriceOfBestMatches && worstPriceOfBestMatches.gt(0) ? worstPriceOfBestMatches : undefined
  const isDisabled =
    amounts.buying.lte(0) ||
    amounts.selling.lte(0) ||
    amounts.selling.gt(props.sellingBalance) ||
    getPrice(amounts.price, bestPrice).lte(0)

  const { relativeSpread } = calculateSpread(tradePair.asks, tradePair.bids)

  const updateBuyingAmount = React.useCallback(
    (amount: BigNumber) => {
      setAmounts(prev => ({
        buying: amount,
        price: prev.price,
        selling: getPrice(prev.price, bestPrice).gt(0) ? amount.div(getPrice(prev.price, bestPrice)) : prev.selling
      }))
    },
    [bestPrice]
  )

  const updatePrice = React.useCallback((newPrice: BigNumber, editing: "buying" | "selling") => {
    setAmounts(prev => ({
      buying: editing === "buying" ? prev.buying : prev.selling.mul(newPrice),
      price: newPrice,
      selling: editing === "buying" ? prev.buying.div(newPrice) : prev.selling
    }))
  }, [])

  const updateSellingAmount = React.useCallback(
    (amount: BigNumber) => {
      setAmounts(prev => ({
        buying: getPrice(prev.price, bestPrice).gt(0) ? amount.mul(getPrice(prev.price, bestPrice)) : prev.buying,
        price: prev.price,
        selling: amount
      }))
    },
    [bestPrice]
  )

  return (
    <VerticalLayout alignItems="stretch" alignSelf="center" grow={1} shrink={1} width="100%">
      <TradePropertiesForm
        buying={props.buying}
        buyingAmount={amounts.buying}
        buyingBalance={props.buyingBalance}
        estimatedReturn={estimatedReturn}
        onSelectAssets={props.onSelectAssets}
        onSetBuyingAmount={updateBuyingAmount}
        onSetPrice={updatePrice}
        onSetSellingAmount={updateSellingAmount}
        price={getPrice(amounts.price, bestPrice)}
        selling={props.selling}
        sellingAmount={amounts.selling}
        sellingBalance={props.sellingBalance}
        trustlines={props.trustlines}
      />
      {relativeSpread > 0.01 ? (
        <Box margin="24px 0 0" padding="8px 12px" style={{ background: warningColor }}>
          <b>Warning</b>
          <br />
          Large spread ({(relativeSpread * 100).toFixed(1)}%) between buying and selling price. Prices are not ideal.
        </Box>
      ) : null}
      <DialogActions
        amount={amounts.selling}
        disabled={isDisabled}
        price={getPrice(amounts.price, bestPrice)}
        style={{ justifySelf: "flex-end" }}
      />
    </VerticalLayout>
  )
}

export default React.memo(TradingForm)

import BigNumber from "big.js"
import React from "react"
import { Asset, AssetType, Horizon } from "stellar-sdk"
import { useLiveOrderbook } from "../../hooks/stellar-subscriptions"
import { calculateSpread } from "../../lib/orderbook"
import { Box, VerticalLayout } from "../Layout/Box"
import { warningColor } from "../../theme"
import { useConversionOffers } from "./hooks"
import TradePropertiesForm from "./TradePropertiesForm"

function isDisabled(sellingAmount: BigNumber, price: BigNumber, balance: BigNumber) {
  return sellingAmount.lte(0) || sellingAmount.gt(balance) || price.lte(0)
}

interface Amounts {
  buying: BigNumber
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

  const [amounts, setAmounts] = React.useState<Amounts>(() => ({ buying: BigNumber(0), selling: BigNumber(0) }))
  const [manualPrice, setManualPrice] = React.useState<BigNumber | undefined>()

  const { estimatedReturn, worstPriceOfBestMatches } = useConversionOffers(
    tradePair.bids,
    amounts.selling.gt(0) ? amounts.selling : BigNumber(0.01)
  )

  const bestPrice = worstPriceOfBestMatches && worstPriceOfBestMatches.gt(0) ? worstPriceOfBestMatches : undefined

  const price = manualPrice || bestPrice || BigNumber(0)
  const { relativeSpread } = calculateSpread(tradePair.asks, tradePair.bids)

  const updateBuyingAmount = (amount: BigNumber) => {
    setAmounts({
      buying: amount,
      selling: amount.div(price)
    })
  }
  const updateSellingAmount = (amount: BigNumber) => {
    setAmounts({
      buying: amount.mul(price),
      selling: amount
    })
  }

  return (
    <VerticalLayout alignItems="stretch" alignSelf="center" grow={1} shrink={1} width="100%">
      <TradePropertiesForm
        buying={props.buying}
        buyingAmount={amounts.buying}
        buyingBalance={props.buyingBalance}
        estimatedReturn={estimatedReturn}
        manualPrice={manualPrice}
        onSelectAssets={props.onSelectAssets}
        onSetBuyingAmount={updateBuyingAmount}
        onSetManualPrice={setManualPrice}
        onSetSellingAmount={updateSellingAmount}
        price={price}
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
        disabled={isDisabled(amounts.selling, price, BigNumber(props.sellingBalance))}
        price={price}
        style={{ justifySelf: "flex-end" }}
      />
    </VerticalLayout>
  )
}

export default React.memo(TradingForm)

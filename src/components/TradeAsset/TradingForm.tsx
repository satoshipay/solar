import BigNumber from "big.js"
import React from "react"
import { useState } from "react"
import { Asset, AssetType, Horizon } from "stellar-sdk"
import { useOrderbook } from "../../hooks"
import { calculateSpread } from "../../lib/orderbook"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { warningColor } from "../../theme"
import Explanation from "./Explanation"
import { useConversionOffers } from "./hooks"
import TradePropertiesForm from "./TradePropertiesForm"

type ToleranceValue = 0 | 0.01 | 0.02

function isDisabled(amount: number, price: number, balance: number) {
  return [Number.isNaN(amount), Number.isNaN(price), amount <= 0, amount > balance, price <= 0].some(
    condition => condition === true
  )
}

interface DialogActionsProps {
  amount: number
  disabled?: boolean
  price: number
  style?: React.CSSProperties
}

interface Props {
  buying: Asset
  buyingBalance: string
  onSetBuying: (assetCode: string) => void
  onSetSelling: (assetCode: string) => void
  selling: Asset
  sellingBalance: string
  testnet: boolean
  trustlines: Array<Horizon.BalanceLineAsset<AssetType.credit4 | AssetType.credit12>>
  DialogActions: React.ComponentType<DialogActionsProps>
}

function TradingForm(props: Props) {
  const DialogActions = props.DialogActions
  const tradePair = useOrderbook(props.selling, props.buying, props.testnet)

  const [amountString, setAmountString] = useState("")
  const [manualPriceString, setManualPriceString] = useState("")
  const [tolerance, setTolerance] = useState<ToleranceValue>(0)

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? 0 : Number.parseFloat(amountString)
  const manualPrice = Number.isNaN(Number.parseFloat(manualPriceString)) ? 0 : Number.parseFloat(manualPriceString)
  const { estimatedReturn, worstPriceOfBestMatches } = useConversionOffers(tradePair.bids, amount || 0.01, tolerance)

  const price = worstPriceOfBestMatches || manualPrice || 0
  const { relativeSpread } = calculateSpread(tradePair.asks, tradePair.bids)

  return (
    <VerticalLayout>
      <HorizontalLayout shrink={0} justifyContent="space-between" margin="0 -24px" wrap="wrap">
        <VerticalLayout alignItems="stretch" basis="40%" grow={1} shrink={1} margin="40px 24px 0">
          <TradePropertiesForm
            {...props}
            amount={amountString}
            estimatedReturn={estimatedReturn}
            manualPrice={manualPriceString}
            onSetAmount={setAmountString}
            onSetManualPrice={setManualPriceString}
            onSetTolerance={setTolerance}
            price={worstPriceOfBestMatches ? BigNumber(worstPriceOfBestMatches) : BigNumber(0)}
            tolerance={tolerance}
          />
          {relativeSpread > 0.01 ? (
            <Box padding="8px 12px" style={{ background: warningColor }}>
              <b>Warning</b>
              <br />
              Large spread ({(relativeSpread * 100).toFixed(1)}
              %) between buying and selling price. Converting the funds back might be expensive.
            </Box>
          ) : null}
          <div style={{ flexGrow: 1 }} />
          <DialogActions
            amount={amount}
            disabled={amountString === "" || isDisabled(amount, price, Number.parseFloat(props.sellingBalance))}
            price={price}
            style={{ justifySelf: "flex-end" }}
          />
        </VerticalLayout>
        <VerticalLayout alignItems="stretch" basis="40%" grow={1} shrink={1} margin="16px 24px 8px" minWidth={350}>
          <Explanation />
        </VerticalLayout>
      </HorizontalLayout>
    </VerticalLayout>
  )
}

export default TradingForm

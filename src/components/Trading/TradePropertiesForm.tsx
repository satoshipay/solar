import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import TextField from "@material-ui/core/TextField"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import { makeStyles } from "@material-ui/styles"
import theme from "../../theme"
import { formatBalance } from "../Account/AccountBalances"
import AssetSelector from "../Form/AssetSelector"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { HorizontalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"
import TradingPrice from "./TradingPrice"

const useTradeFormStyles = makeStyles({
  rowIcon: {
    color: theme.palette.action.disabled,
    fontSize: "300%",
    marginRight: "calc(8px + 1.5vw)"
  }
})

interface TradePropertiesFormProps {
  amount: string
  buying: Asset
  buyingBalance: string
  estimatedReturn: BigNumber
  manualPrice: BigNumber | undefined
  priceMode: "fixed-buying" | "fixed-selling"
  onSetAmount: (amount: string) => void
  onSetBuying: (asset: Asset) => void
  onSetSelling: (asset: Asset) => void
  onSetManualPrice: (price: BigNumber) => void
  onTogglePriceMode: () => void
  price: BigNumber
  selling: Asset
  sellingBalance: string
  trustlines: Horizon.BalanceLine[]
}

function TradePropertiesForm(props: TradePropertiesFormProps) {
  const classes = useTradeFormStyles()
  const [isEditingPrice, setIsEditingPrice] = React.useState(false)
  const [manualPriceError, setManualPriceError] = React.useState<Error | undefined>()
  const [manualPriceString, setManualPriceString] = React.useState<string | undefined>()

  const applyManualPrice = () => {
    if (manualPriceString && /^[0-9]+(\.[0-9]+)?$/.test(manualPriceString)) {
      setManualPriceError(undefined)
      setIsEditingPrice(false)

      const manualPrice = BigNumber(manualPriceString)
      props.onSetManualPrice(props.priceMode === "fixed-buying" ? BigNumber(1).div(manualPrice) : manualPrice)
    } else {
      setManualPriceError(Error("Invalid price entered."))
      setIsEditingPrice(false)
    }
  }

  const dismissManualPrice = () => {
    setManualPriceString(undefined)
    setManualPriceError(undefined)
    setIsEditingPrice(false)
  }

  const estimatedReturn = props.amount ? BigNumber(props.amount).mul(props.price) : BigNumber(0)

  const setBuying = (newBuyingAsset: Asset) => {
    if (newBuyingAsset.equals(props.selling) && !newBuyingAsset.equals(props.buying)) {
      // Swap buying and selling asset
      props.onSetSelling(props.buying)
    }
    props.onSetBuying(newBuyingAsset)
  }

  const setSelling = (newSellingAsset: Asset) => {
    if (newSellingAsset.equals(props.buying) && !newSellingAsset.equals(props.selling)) {
      // Swap buying and selling asset
      props.onSetBuying(props.selling)
    }
    props.onSetSelling(newSellingAsset)
  }

  const startEditingPrice = React.useCallback(() => {
    const price = props.priceMode === "fixed-buying" ? BigNumber(1).div(props.price) : props.price
    setManualPriceString(price.toFixed(7))
    setIsEditingPrice(true)
  }, [props.price, props.priceMode])

  return (
    <>
      <HorizontalLayout alignItems="center" margin="24px 0">
        <CallMadeIcon className={classes.rowIcon} />
        <AssetSelector onChange={setSelling} trustlines={props.trustlines} value={props.selling} />
        <HorizontalMargin size={8} />
        <TextField
          autoFocus={process.env.PLATFORM !== "ios"}
          inputProps={{
            style: { height: 27, textAlign: "right" }
          }}
          onChange={event => props.onSetAmount(event.target.value)}
          placeholder={`Max. ${props.sellingBalance}`}
          type="number"
          style={{ flexGrow: 1, flexShrink: 1, marginLeft: "auto", maxWidth: 200 }}
          value={props.amount}
        />
      </HorizontalLayout>
      <HorizontalLayout alignItems="center" justifyContent="center" margin="24px 0">
        <TradingPrice
          buying={props.buying}
          inputError={manualPriceError}
          isEditingPrice={isEditingPrice}
          isPriceSwitched={props.priceMode === "fixed-buying"}
          manualPrice={manualPriceString}
          onApplyManualPrice={applyManualPrice}
          onDismissManualPrice={dismissManualPrice}
          onEditPrice={startEditingPrice}
          onSetManualPrice={setManualPriceString}
          onSwitchPriceAssets={props.onTogglePriceMode}
          price={props.price}
          selling={props.selling}
        />
      </HorizontalLayout>
      <HorizontalLayout alignItems="center" margin="24px 0">
        <CallReceivedIcon className={classes.rowIcon} />
        <AssetSelector onChange={setBuying} trustlines={props.trustlines} value={props.buying} />
        <HorizontalMargin size={8} />
        <ReadOnlyTextfield
          disableUnderline
          inputProps={{
            style: {
              cursor: "default",
              height: 27,
              textAlign: "right"
            }
          }}
          placeholder={`Max. ${props.buyingBalance}`}
          style={{ flexGrow: 1, flexShrink: 1, fontWeight: "bold", marginLeft: "auto", maxWidth: 200 }}
          value={formatBalance(String(estimatedReturn), { minimumSignificants: 3 })}
        />
      </HorizontalLayout>
    </>
  )
}

export default React.memo(TradePropertiesForm)

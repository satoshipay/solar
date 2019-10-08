import BigNumber from "big.js"
import throttle from "lodash.throttle"
import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import InputLabel from "@material-ui/core/InputLabel"
import TextField from "@material-ui/core/TextField"
import { makeStyles } from "@material-ui/core/styles"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import theme, { breakpoints } from "../../theme"
import { formatBalance } from "../Account/AccountBalances"
import AssetSelector from "../Form/AssetSelector"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"
import TradingPrice from "./TradingPrice"

const bigNumberToInputValue = (bignum: BigNumber) => formatBalance(bignum, { minimumSignificants: 3 })
const isValidPrice = (price: string) => /^[0-9]+(\.[0-9]+)?$/.test(price)

const useTradeFormStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",

    [breakpoints.down(600)]: {
      alignItems: "stretch",
      flexDirection: "column"
    }
  },
  tradePairInput: {
    display: "flex",
    alignItems: "center",
    flexBasis: "50%",
    margin: "24px -1.5vw",
    padding: "0 1.5vw",

    [breakpoints.down(600)]: {
      flexBasis: "auto",
      margin: "24px 0",
      padding: 0
    }
  },
  displayPrice: {
    justifyContent: "center",
    flexBasis: "auto",
    order: 3,
    width: "100%",

    [breakpoints.down(600)]: {
      marginTop: 0,
      marginBottom: 12,
      order: "initial"
    }
  },
  rowIcon: {
    color: theme.palette.action.disabled,
    fontSize: "300%",
    marginRight: "calc(8px + 1.5vw)"
  },
  rowIconLabel: {
    marginTop: -12,
    textAlign: "center"
  }
})

interface EditableAmount {
  field: "buying" | "selling"
  value: string
}

interface ManualPrice {
  error?: Error
  value?: string
}

interface TradePropertiesFormProps {
  buying: Asset
  buyingAmount: BigNumber
  buyingBalance: string
  estimatedReturn: BigNumber
  onSelectAssets: (assets: { buying: Asset; selling: Asset }) => void
  onSetBuyingAmount: (amount: BigNumber) => void
  onSetPrice: (price: BigNumber, editing: "buying" | "selling") => void
  onSetSellingAmount: (amount: BigNumber) => void
  price: BigNumber
  selling: Asset
  sellingAmount: BigNumber
  sellingBalance: string
  trustlines: Horizon.BalanceLine[]
}

function TradePropertiesForm(props: TradePropertiesFormProps) {
  const classes = useTradeFormStyles()
  const priceInputRef = React.useRef<HTMLElement>(null)
  const [editableAmount, setEditableAmount] = React.useState<EditableAmount>({ field: "selling", value: "" })
  const [manualPrice, setManualPrice] = React.useState<ManualPrice>({})
  const [priceMode, setPriceMode] = React.useState<"fixed-buying" | "fixed-selling">("fixed-selling")

  const defaultPrice = bigNumberToInputValue(priceMode === "fixed-buying" ? BigNumber(1).div(props.price) : props.price)

  const buyingAmountString =
    editableAmount.field === "buying" ? editableAmount.value : bigNumberToInputValue(props.buyingAmount)

  const sellingAmountString =
    editableAmount.field === "selling" ? editableAmount.value : bigNumberToInputValue(props.sellingAmount)

  const setBuying = (newBuyingAsset: Asset) => {
    const swapSelection = newBuyingAsset.equals(props.selling) && !newBuyingAsset.equals(props.buying)

    props.onSelectAssets({
      buying: newBuyingAsset,
      selling: swapSelection ? props.buying : props.selling
    })
  }

  const setSelling = (newSellingAsset: Asset) => {
    const swapSelection = newSellingAsset.equals(props.buying) && !newSellingAsset.equals(props.selling)

    props.onSelectAssets({
      buying: swapSelection ? props.selling : props.buying,
      selling: newSellingAsset
    })
  }

  const startEditingPrice = React.useCallback(() => {
    if (priceInputRef.current) {
      priceInputRef.current.focus()
    }
  }, [])

  const togglePriceMode = React.useCallback(() => {
    setPriceMode(prev => (prev === "fixed-buying" ? "fixed-selling" : "fixed-buying"))
    setManualPrice(prev => ({
      value: prev.value && isValidPrice(prev.value) ? bigNumberToInputValue(BigNumber(1).div(prev.value)) : prev.value
    }))
  }, [])

  const updateAmount = throttle((field: "buying" | "selling", event: React.ChangeEvent<HTMLInputElement>) => {
    const amount = event.target.value

    setEditableAmount({
      field,
      value: amount
    })

    if (!Number.isNaN(Number.parseFloat(amount))) {
      const setter = field === "buying" ? props.onSetBuyingAmount : props.onSetSellingAmount
      setter(BigNumber(amount))
    }
  }, 300)

  const updateEditingField = (field: "buying" | "selling") => {
    setEditableAmount(prev => ({
      field,
      value:
        prev.field === field
          ? prev.value
          : field === "buying"
          ? bigNumberToInputValue(props.buyingAmount)
          : bigNumberToInputValue(props.sellingAmount)
    }))
  }

  const updatePrice = (newPriceAmount: string) => {
    setManualPrice(prev => ({
      error: isValidPrice(newPriceAmount) ? undefined : prev.error,
      value: newPriceAmount
    }))

    if (isValidPrice(newPriceAmount)) {
      const newPrice = priceMode === "fixed-buying" ? BigNumber(1).div(newPriceAmount) : BigNumber(newPriceAmount)
      props.onSetPrice(newPrice, editableAmount.field)
    }
  }

  const validatePrice = React.useCallback(() => {
    setManualPrice(prev => ({
      error: prev.value && !isValidPrice(prev.value) ? Error("Invalid price") : undefined,
      value: prev.value
    }))
  }, [])

  return (
    <Box className={classes.root}>
      <HorizontalLayout className={classes.tradePairInput}>
        <VerticalLayout>
          <InputLabel className={classes.rowIconLabel}>Selling</InputLabel>
          <CallMadeIcon className={classes.rowIcon} />
        </VerticalLayout>
        <AssetSelector onChange={setSelling} trustlines={props.trustlines} value={props.selling} />
        <HorizontalMargin size={16} />
        <TextField
          autoFocus={process.env.PLATFORM !== "ios"}
          inputProps={{
            style: { height: 27, textAlign: "right" }
          }}
          onChange={event => updateAmount("selling", event as React.ChangeEvent<HTMLInputElement>)}
          onFocus={() => updateEditingField("selling")}
          placeholder={`Max. ${props.sellingBalance}`}
          required
          style={{ flexGrow: 1, flexShrink: 1, marginLeft: "auto", maxWidth: 200 }}
          type="number"
          value={sellingAmountString}
        />
      </HorizontalLayout>
      <HorizontalLayout className={`${classes.tradePairInput} ${classes.displayPrice}`}>
        <TradingPrice
          buying={props.buying}
          inputError={manualPrice.error}
          inputRef={priceInputRef}
          manualPrice={manualPrice.value !== undefined ? manualPrice.value : defaultPrice}
          onBlur={validatePrice}
          onChange={updatePrice}
          onEditClick={startEditingPrice}
          onSwitchPriceAssets={togglePriceMode}
          price={props.price}
          selling={props.selling}
          variant={priceMode}
        />
      </HorizontalLayout>
      <HorizontalLayout className={classes.tradePairInput}>
        <VerticalLayout>
          <InputLabel className={classes.rowIconLabel}>Buying</InputLabel>
          <CallReceivedIcon className={classes.rowIcon} />
        </VerticalLayout>
        <AssetSelector onChange={setBuying} trustlines={props.trustlines} value={props.buying} />
        <HorizontalMargin size={16} />
        <TextField
          inputProps={{
            style: { height: 27, textAlign: "right" }
          }}
          onChange={event => updateAmount("buying", event as React.ChangeEvent<HTMLInputElement>)}
          onFocus={() => updateEditingField("buying")}
          placeholder={`Max. ${props.buyingBalance}`}
          required
          style={{ flexGrow: 1, flexShrink: 1, marginLeft: "auto", maxWidth: 200 }}
          type="number"
          value={buyingAmountString}
        />
      </HorizontalLayout>
    </Box>
  )
}

export default React.memo(TradePropertiesForm)

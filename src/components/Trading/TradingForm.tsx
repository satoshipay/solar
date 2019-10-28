import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon, Transaction, Operation } from "stellar-sdk"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import GavelIcon from "@material-ui/icons/Gavel"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useHorizon } from "../../hooks/stellar"
import { useLiveOrderbook, ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
import { calculateSpread } from "../../lib/orderbook"
import { balancelineToAsset } from "../../lib/stellar"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import AssetSelector from "../Form/AssetSelector"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import theme, { warningColor } from "../../theme"
import { useConversionOffers } from "./hooks"
import Portal from "../Portal"
import TradingPrice from "./TradingPrice"
import { createTransaction } from "../../lib/transaction"

const bigNumberToInputValue = (bignum: BigNumber) =>
  formatBalance(bignum, { minimumSignificants: 3, maximumSignificants: 9 })
const isValidAmount = (amount: string) => /^[0-9]+([\.,][0-9]+)?$/.test(amount)

function findMatchingBalance(balances: ObservedAccountData["balances"], asset: Asset) {
  return balances.find(balance => balancelineToAsset(balance).equals(asset))
}

interface ManualPrice {
  error?: Error
  value?: string
}

interface Props {
  account: Account
  accountData: ObservedAccountData
  className?: string
  dialogActionsRef: RefStateObject
  initialPrimaryAsset?: Asset
  onBack: () => void
  primaryAction: "buy" | "sell"
  sendTransaction: (transaction: Transaction) => void
  style?: React.CSSProperties
  trustlines: Horizon.BalanceLineAsset[]
}

function TradingForm(props: Props) {
  const isSmallScreen = useIsMobile()
  const priceInputRef = React.useRef<HTMLElement>(null)
  const [primaryAsset, setPrimaryAsset] = React.useState<Asset | undefined>(props.initialPrimaryAsset)
  const [primaryAmountString, setPrimaryAmountString] = React.useState("")
  const [secondaryAsset, setSecondaryAsset] = React.useState<Asset>(Asset.native())
  const [manualPrice, setManualPrice] = React.useState<ManualPrice>({})
  const [priceMode, setPriceMode] = React.useState<"fixed-buying" | "fixed-selling">("fixed-selling")

  const horizon = useHorizon(props.account.testnet)
  const tradePair = useLiveOrderbook(primaryAsset || Asset.native(), secondaryAsset, props.account.testnet)
  const isSmallHeightScreen = useMediaQuery("(max-height: 600px)")

  const price =
    manualPrice.value && isValidAmount(manualPrice.value)
      ? priceMode === "fixed-selling"
        ? BigNumber(manualPrice.value)
        : BigNumber(1).div(manualPrice.value)
      : BigNumber(0)

  const primaryAmount =
    primaryAmountString && isValidAmount(primaryAmountString) ? BigNumber(primaryAmountString) : BigNumber(0)

  const primaryBalance = primaryAsset ? findMatchingBalance(props.accountData.balances, primaryAsset) : undefined

  const secondaryBalance = secondaryAsset ? findMatchingBalance(props.accountData.balances, secondaryAsset) : undefined

  const startEditingPrice = React.useCallback(() => {
    if (priceInputRef.current) {
      priceInputRef.current.focus()
    }
  }, [])

  const togglePriceMode = React.useCallback(() => {
    setPriceMode(prev => (prev === "fixed-buying" ? "fixed-selling" : "fixed-buying"))
    setManualPrice(prev => ({
      value: prev.value && isValidAmount(prev.value) ? bigNumberToInputValue(BigNumber(1).div(prev.value)) : prev.value
    }))
  }, [])

  const updatePrice = (newPriceAmount: string) => {
    setManualPrice(prev => ({
      error: isValidAmount(newPriceAmount) ? undefined : prev.error,
      value: newPriceAmount
    }))
  }

  const validatePrice = React.useCallback(() => {
    setManualPrice(prev => ({
      error: prev.value && !isValidAmount(prev.value) ? Error("Invalid price") : undefined,
      value: prev.value
    }))
  }, [])

  const { worstPriceOfBestMatches } = useConversionOffers(
    tradePair.bids,
    primaryAmount.gt(0) ? primaryAmount : BigNumber(0.01)
  )

  const { relativeSpread } = calculateSpread(tradePair.asks, tradePair.bids)
  const bestPrice = worstPriceOfBestMatches && worstPriceOfBestMatches.gt(0) ? worstPriceOfBestMatches : undefined
  const effectivePrice = price.gt(0) ? price : bestPrice || BigNumber(0)
  const secondaryAmount = primaryAmount.mul(effectivePrice)

  // prevent division by zero
  const inversePrice = effectivePrice.eq(0) ? BigNumber(0) : BigNumber(1).div(effectivePrice)
  const defaultPrice = bigNumberToInputValue(priceMode === "fixed-buying" ? inversePrice : effectivePrice)

  const sellingAmount = props.primaryAction === "sell" ? primaryAmount : secondaryAmount
  const sellingBalance: { balance: string } = (props.primaryAction === "sell" ? primaryBalance : secondaryBalance) || {
    balance: "0"
  }

  const maxPrimaryAmount =
    props.primaryAction === "buy"
      ? secondaryBalance && effectivePrice.gt(0)
        ? BigNumber(secondaryBalance.balance).mul(effectivePrice)
        : BigNumber(0)
      : primaryBalance
      ? BigNumber(primaryBalance.balance)
      : BigNumber(0)

  const isDisabled =
    !primaryAsset || primaryAmount.lte(0) || sellingAmount.gt(sellingBalance.balance) || effectivePrice.lte(0)

  const submitForm = React.useCallback(async () => {
    try {
      if (!primaryAsset) {
        throw Error("Invariant violation: Should not be able to submit form without having selected the primary asset.")
      }

      const tx = await createTransaction(
        [
          props.primaryAction === "buy"
            ? Operation.manageBuyOffer({
                buyAmount: primaryAmount.toFixed(7),
                buying: primaryAsset,
                offerId: 0,
                price: effectivePrice.toFixed(7),
                selling: secondaryAsset
              })
            : Operation.manageSellOffer({
                amount: primaryAmount.toFixed(7),
                buying: secondaryAsset,
                offerId: 0,
                price: effectivePrice.toFixed(7),
                selling: primaryAsset
              })
        ],
        {
          accountData: props.accountData,
          horizon,
          walletAccount: props.account
        }
      )
      props.sendTransaction(tx)
    } catch (error) {
      trackError(error)
    }
  }, [props.accountData, props.sendTransaction, effectivePrice, primaryAmount, primaryAsset, secondaryAsset])

  return (
    // set minHeight to prevent wrapping of layout when keyboard is shown
    <VerticalLayout
      alignItems="stretch"
      alignSelf="center"
      grow={1}
      justifyContent={isSmallScreen ? undefined : "center"}
      maxHeight="100%"
      padding="16px 0"
      shrink={1}
      width="100%"
    >
      <VerticalLayout
        alignItems="stretch"
        alignSelf="center"
        minHeight={350}
        minWidth={isSmallScreen ? undefined : 450}
        maxWidth={isSmallScreen ? "100%" : 600}
        padding="0 8px"
      >
        <Typography
          color="textPrimary"
          style={{ margin: `${isSmallHeightScreen ? "0" : "48px"} 8px 8px` }}
          variant="h6"
        >
          {props.primaryAction === "buy" ? "Buying" : "Selling"}
        </Typography>
        <HorizontalLayout margin="0 8px">
          <AssetSelector
            autoFocus={Boolean(process.env.PLATFORM !== "ios" && !props.initialPrimaryAsset)}
            onChange={setPrimaryAsset}
            style={{ marginRight: 16 }}
            trustlines={props.trustlines}
            value={primaryAsset}
          />
          <TextField
            autoFocus={Boolean(process.env.PLATFORM !== "ios" && props.initialPrimaryAsset)}
            inputProps={{
              style: { height: 27, textAlign: "right" }
            }}
            onChange={event => setPrimaryAmountString(event.target.value)}
            placeholder={`Max. ${bigNumberToInputValue(maxPrimaryAmount)}`}
            required
            style={{ flexGrow: 1, flexShrink: 1, marginLeft: "auto", maxWidth: 200 }}
            type="number"
            value={primaryAmountString}
          />
        </HorizontalLayout>
        <Typography color="textPrimary" style={{ margin: "48px 8px 8px" }} variant="h6">
          {props.primaryAction === "buy" ? "Costs" : "Gain"}
        </Typography>
        <VerticalLayout
          margin="8px -8px 0"
          padding="16px"
          style={{
            background: theme.palette.grey["100"],
            border: `1px solid ${theme.palette.grey["A100"]}`,
            borderRadius: theme.shape.borderRadius
          }}
        >
          <TradingPrice
            buying={props.primaryAction === "buy" ? primaryAsset : secondaryAsset}
            inputError={manualPrice.error}
            inputRef={priceInputRef}
            manualPrice={manualPrice.value !== undefined ? manualPrice.value : defaultPrice}
            onBlur={validatePrice}
            onChange={updatePrice}
            onEditClick={startEditingPrice}
            onSwitchPriceAssets={togglePriceMode}
            price={effectivePrice}
            selling={props.primaryAction === "sell" ? primaryAsset : secondaryAsset}
            style={{
              alignSelf: "center",
              background: theme.palette.grey["100"],
              marginBottom: -16,
              marginTop: -16,
              transform: "translateY(-50%)"
            }}
            variant={priceMode}
          />
          <HorizontalLayout>
            <AssetSelector onChange={setSecondaryAsset} trustlines={props.trustlines} value={secondaryAsset} />
            <ReadOnlyTextfield
              disableUnderline
              inputProps={{
                style: { height: 27, textAlign: "right" }
              }}
              placeholder={`Max. ${secondaryBalance ? secondaryBalance.balance : "0"}`}
              required
              style={{ flexGrow: 1, flexShrink: 1, marginLeft: "auto", maxWidth: 200 }}
              type="number"
              value={bigNumberToInputValue(secondaryAmount)}
            />
          </HorizontalLayout>
        </VerticalLayout>
        <HorizontalLayout justifyContent="center" margin="40px 0 0" textAlign="center">
          <Typography color="textSecondary" variant="body1">
            {props.primaryAction === "buy"
              ? `«Buy ${bigNumberToInputValue(primaryAmount)} ${primaryAsset ? primaryAsset.getCode() : "-"} ` +
                `for ${bigNumberToInputValue(secondaryAmount)} ${secondaryAsset ? secondaryAsset.getCode() : "-"}»`
              : `«Sell ${bigNumberToInputValue(primaryAmount)} ${primaryAsset ? primaryAsset.getCode() : "-"} ` +
                `for ${bigNumberToInputValue(secondaryAmount)} ${secondaryAsset ? secondaryAsset.getCode() : "-"}»`}
          </Typography>
        </HorizontalLayout>
        {relativeSpread >= 0.015 ? (
          <Box margin="24px 0 0" padding="8px 12px" style={{ background: warningColor }}>
            <b>Warning</b>
            <br />
            Large spread ({(relativeSpread * 100).toFixed(1)}%) between buying and selling price. Prices are not ideal.
          </Box>
        ) : null}
        <Portal target={props.dialogActionsRef.element}>
          <DialogActionsBox>
            <ActionButton onClick={props.onBack} type="secondary">
              Back
            </ActionButton>
            <ActionButton disabled={isDisabled} icon={<GavelIcon />} onClick={submitForm} type="primary">
              Place order
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </VerticalLayout>
    </VerticalLayout>
  )
}

export default React.memo(TradingForm)

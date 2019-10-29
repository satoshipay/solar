import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon, Transaction, Operation } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
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
import { warningColor } from "../../theme"
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
  const [primaryAsset, setPrimaryAsset] = React.useState<Asset | undefined>(props.initialPrimaryAsset)
  const [primaryAmountString, setPrimaryAmountString] = React.useState("")
  const [secondaryAsset, setSecondaryAsset] = React.useState<Asset>(Asset.native())
  const [manualPrice, setManualPrice] = React.useState<ManualPrice>({})
  const [priceMode, setPriceMode] = React.useState<"primary" | "secondary">("secondary")

  const horizon = useHorizon(props.account.testnet)
  const tradePair = useLiveOrderbook(primaryAsset || Asset.native(), secondaryAsset, props.account.testnet)

  const price =
    manualPrice.value && isValidAmount(manualPrice.value)
      ? priceMode === "secondary"
        ? BigNumber(manualPrice.value)
        : BigNumber(manualPrice.value).eq(0) // prevent division by zero
        ? BigNumber(0)
        : BigNumber(1).div(manualPrice.value)
      : BigNumber(0)

  const primaryAmount =
    primaryAmountString && isValidAmount(primaryAmountString) ? BigNumber(primaryAmountString) : BigNumber(0)

  const primaryBalance = primaryAsset ? findMatchingBalance(props.accountData.balances, primaryAsset) : undefined

  const secondaryBalance = secondaryAsset ? findMatchingBalance(props.accountData.balances, secondaryAsset) : undefined

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
    props.primaryAction === "buy" ? tradePair.asks : tradePair.bids,
    primaryAmount.gt(0) ? primaryAmount : BigNumber(0.01),
    props.primaryAction === "sell"
  )

  const { relativeSpread } = calculateSpread(tradePair.asks, tradePair.bids)
  const bestPrice = worstPriceOfBestMatches && worstPriceOfBestMatches.gt(0) ? worstPriceOfBestMatches : undefined
  const effectivePrice = price.gt(0) ? price : bestPrice || BigNumber(0)
  const secondaryAmount = primaryAmount.mul(effectivePrice)

  // prevent division by zero
  const inversePrice = effectivePrice.eq(0) ? BigNumber(0) : BigNumber(1).div(effectivePrice)
  const defaultPrice = bigNumberToInputValue(priceMode === "secondary" ? effectivePrice : inversePrice)

  const sellingAmount = props.primaryAction === "sell" ? primaryAmount : secondaryAmount
  const sellingBalance: { balance: string } = (props.primaryAction === "sell" ? primaryBalance : secondaryBalance) || {
    balance: "0"
  }

  const maxPrimaryAmount =
    props.primaryAction === "buy"
      ? secondaryBalance && effectivePrice.gt(0)
        ? BigNumber(secondaryBalance.balance).div(effectivePrice)
        : BigNumber(0)
      : primaryBalance
      ? BigNumber(primaryBalance.balance)
      : BigNumber(0)

  const isDisabled =
    !primaryAsset || primaryAmount.lte(0) || sellingAmount.gt(sellingBalance.balance) || effectivePrice.lte(0)

  const setPrimaryAmountToMax = () => {
    setPrimaryAmountString(maxPrimaryAmount.toFixed(7))
  }

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
      alignSelf={isSmallScreen ? undefined : "center"}
      grow={1}
      justifyContent={isSmallScreen ? undefined : "center"}
      minHeight={300}
      maxHeight="100%"
      margin={isSmallScreen ? undefined : "32px 0 0"}
      padding="16px 0"
      shrink={1}
      width="100%"
    >
      <VerticalLayout
        alignItems="stretch"
        alignSelf={isSmallScreen ? "stretch" : "center"}
        minWidth={isSmallScreen ? "75%" : 450}
        maxWidth={isSmallScreen ? "100%" : 500}
        padding="0 2px"
        shrink={0}
        width="100%"
      >
        <HorizontalLayout>
          <AssetSelector
            autoFocus={Boolean(process.env.PLATFORM !== "ios" && !props.initialPrimaryAsset)}
            label={props.primaryAction === "buy" ? "You buy" : "You sell"}
            onChange={setPrimaryAsset}
            minWidth={75}
            style={{ flexGrow: 1, marginRight: 24, maxWidth: 150, width: "25%" }}
            trustlines={props.trustlines}
            value={primaryAsset}
          />
          <TextField
            autoFocus={Boolean(process.env.PLATFORM !== "ios" && props.initialPrimaryAsset)}
            error={
              primaryAmount.lt(0) ||
              (primaryAmountString.length > 0 && primaryAmount.eq(0)) ||
              (props.primaryAction === "sell" && primaryBalance && primaryAmount.gt(primaryBalance.balance)) ||
              (props.primaryAction === "buy" && secondaryBalance && secondaryAmount.gt(secondaryBalance.balance))
            }
            inputProps={{
              min: "0.0000001",
              max: maxPrimaryAmount.toFixed(7),
              style: { height: 27 }
            }}
            InputProps={{
              endAdornment:
                props.primaryAction === "buy" ? (
                  undefined
                ) : (
                  <InputAdornment position="end">
                    <Button
                      disabled={!primaryAsset || !primaryBalance}
                      onClick={setPrimaryAmountToMax}
                      style={{ boxShadow: "none", fontWeight: 400 }}
                    >
                      Max
                    </Button>
                  </InputAdornment>
                )
            }}
            label={props.primaryAction === "buy" ? "Amount to buy" : "Amount to sell"}
            onChange={event => setPrimaryAmountString(event.target.value)}
            placeholder={`Max. ${bigNumberToInputValue(maxPrimaryAmount)}`}
            required
            style={{ flexGrow: 1, flexShrink: 1, width: "55%" }}
            type="number"
            value={primaryAmountString}
          />
        </HorizontalLayout>
        <HorizontalLayout margin="24px 0">
          <div style={{ flexGrow: 1, marginRight: 24, maxWidth: 150, width: "25%" }} />
          <TradingPrice
            inputError={manualPrice.error}
            manualPrice={manualPrice.value !== undefined ? manualPrice.value : defaultPrice}
            onBlur={validatePrice}
            onChange={updatePrice}
            onSetPriceDenotedIn={setPriceMode}
            price={effectivePrice}
            priceDenotedIn={priceMode}
            primaryAsset={primaryAsset}
            secondaryAsset={secondaryAsset}
            style={{ flexGrow: 1, width: "55%" }}
          />
        </HorizontalLayout>
        <HorizontalLayout>
          <AssetSelector
            label={props.primaryAction === "buy" ? "Spend" : "Receive"}
            minWidth={75}
            onChange={setSecondaryAsset}
            style={{ flexGrow: 1, marginRight: 24, maxWidth: 150, width: "25%" }}
            trustlines={props.trustlines}
            value={secondaryAsset}
          />
          <ReadOnlyTextfield
            disableUnderline
            inputProps={{
              style: { height: 27 }
            }}
            label={props.primaryAction === "buy" ? "Estimated costs" : "Estimated return"}
            placeholder={`Max. ${secondaryBalance ? secondaryBalance.balance : "0"}`}
            required
            style={{ flexGrow: 1, flexShrink: 1, width: "55%" }}
            type="number"
            value={bigNumberToInputValue(secondaryAmount)}
          />
        </HorizontalLayout>
        <HorizontalLayout justifyContent="center" margin="32px 0 0" textAlign="center">
          <Typography color="textSecondary" variant="body1">
            {props.primaryAction === "buy"
              ? `«Buy ${bigNumberToInputValue(primaryAmount)} ${primaryAsset ? primaryAsset.getCode() : "-"} ` +
                `for ${bigNumberToInputValue(secondaryAmount)} ${secondaryAsset ? secondaryAsset.getCode() : "-"}»`
              : `«Sell ${bigNumberToInputValue(primaryAmount)} ${primaryAsset ? primaryAsset.getCode() : "-"} ` +
                `for ${bigNumberToInputValue(secondaryAmount)} ${secondaryAsset ? secondaryAsset.getCode() : "-"}»`}
          </Typography>
        </HorizontalLayout>
        {relativeSpread >= 0.015 ? (
          <Box margin="32px 0 0" padding="8px 12px" style={{ background: warningColor }}>
            <b>Warning</b>
            <br />
            The spread between buying and selling price is about {(relativeSpread * 100).toFixed(1)}%.
          </Box>
        ) : null}
        <Portal target={props.dialogActionsRef.element}>
          <DialogActionsBox desktopStyle={{ marginTop: 32 }}>
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

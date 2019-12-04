import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon, Transaction, Operation } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import GavelIcon from "@material-ui/icons/Gavel"
import nanoid from "nanoid"
import { useFormik, FormikErrors } from "formik"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useHorizon } from "../../hooks/stellar"
import { useLiveOrderbook, ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
import { calculateSpread } from "../../lib/orderbook"
import { balancelineToAsset } from "../../lib/stellar"
import { formatBalance, BalanceFormattingOptions } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import AssetSelector from "../Form/AssetSelector"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { warningColor } from "../../theme"
import { useConversionOffers } from "./hooks"
import Portal from "../Portal"
import TradingPrice from "./TradingPrice"
import { createTransaction } from "../../lib/transaction"

const bigNumberToInputValue = (bignum: BigNumber, overrides?: BalanceFormattingOptions) =>
  formatBalance(bignum, { minimumSignificants: 3, maximumSignificants: 9, ...overrides })

const isValidAmount = (amount: string) => /^[0-9]+([\.,][0-9]+)?$/.test(amount)

function findMatchingBalance(balances: ObservedAccountData["balances"], asset: Asset) {
  return balances.find(balance => balancelineToAsset(balance).equals(asset))
}

interface TradingFormValues {
  primaryAsset: Asset | undefined
  primaryAmountString: string
  secondaryAsset: Asset
  manualPrice: string | undefined
  priceMode: "primary" | "secondary"
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

  const formik = useFormik<TradingFormValues>({
    initialValues: {
      primaryAsset: props.initialPrimaryAsset,
      primaryAmountString: "",
      secondaryAsset: Asset.native(),
      manualPrice: undefined,
      priceMode: "secondary"
    },
    validate(values) {
      const errors: FormikErrors<TradingFormValues> = {}

      if (!values.primaryAsset) {
        errors.primaryAsset = "No asset selected."
      }

      if (!values.primaryAmountString) {
        errors.primaryAmountString = "No amount specified!"
      } else if (
        primaryAmount.lt(0) ||
        (primaryAmountString.length > 0 && primaryAmount.eq(0)) ||
        (props.primaryAction === "sell" && primaryBalance && primaryAmount.gt(primaryBalance.balance)) ||
        (props.primaryAction === "buy" && secondaryBalance && secondaryAmount.gt(secondaryBalance.balance))
      ) {
        errors.primaryAmountString = "Invalid amount specified!"
      }

      if (
        (values.manualPrice && (!isValidAmount(values.manualPrice) || BigNumber(values.manualPrice).eq(0))) ||
        BigNumber(defaultPrice).eq(0)
      ) {
        errors.manualPrice = "Invalid Price."
      }

      return errors
    },
    async onSubmit() {
      try {
        const tx = await createTransaction(
          [
            props.primaryAction === "buy"
              ? Operation.manageBuyOffer({
                  buyAmount: primaryAmount.toFixed(7),
                  buying: primaryAsset!,
                  offerId: 0,
                  price: effectivePrice.toFixed(7),
                  selling: secondaryAsset
                })
              : Operation.manageSellOffer({
                  amount: primaryAmount.toFixed(7),
                  buying: secondaryAsset,
                  offerId: 0,
                  price: effectivePrice.toFixed(7),
                  selling: primaryAsset!
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
    }
  })

  const { primaryAsset, primaryAmountString, secondaryAsset, priceMode, manualPrice } = formik.values

  const horizon = useHorizon(props.account.testnet)
  const tradePair = useLiveOrderbook(primaryAsset || Asset.native(), secondaryAsset, props.account.testnet)
  const formID = React.useMemo(() => nanoid(), [])

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

  const primaryBalance = primaryAsset ? findMatchingBalance(props.accountData.balances, primaryAsset) : undefined

  const secondaryBalance = secondaryAsset ? findMatchingBalance(props.accountData.balances, secondaryAsset) : undefined

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

  const maxPrimaryAmount =
    props.primaryAction === "buy"
      ? secondaryBalance && effectivePrice.gt(0)
        ? BigNumber(secondaryBalance.balance).div(effectivePrice)
        : BigNumber(0)
      : primaryBalance
      ? BigNumber(primaryBalance.balance)
      : BigNumber(0)

  const setPrimaryAmountToMax = React.useCallback(() => {
    formik.setFieldValue("primaryAmountString", maxPrimaryAmount.toFixed(7))
  }, [])

  const handlePrimaryAssetChange = React.useCallback(asset => formik.setFieldValue("primaryAsset", asset), [])
  const handlePrimaryAmountStringChange = React.useCallback(
    event => formik.setFieldValue("primaryAmountString", event.target.value, false),
    []
  )
  const handleSecondaryAssetChange = React.useCallback(asset => formik.setFieldValue("secondaryAsset", asset), [])
  const handleManualPriceChange = React.useCallback(asset => formik.setFieldValue("manualPrice", asset), [])
  const handlePriceModeChange = React.useCallback(denotedIn => formik.setFieldValue("priceMode", denotedIn), [])

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
        <form noValidate id={formID} onSubmit={formik.handleSubmit}>
          <HorizontalLayout>
            <AssetSelector
              autoFocus={Boolean(process.env.PLATFORM !== "ios" && !props.initialPrimaryAsset)}
              inputError={
                formik.errors.primaryAsset && formik.touched.primaryAsset ? formik.errors.primaryAsset : undefined
              }
              label={props.primaryAction === "buy" ? "You buy" : "You sell"}
              minWidth={75}
              onBlur={formik.handleBlur}
              onChange={handlePrimaryAssetChange}
              style={{ flexGrow: 1, marginRight: 24, maxWidth: 150, width: "25%" }}
              trustlines={props.trustlines}
              value={primaryAsset}
            />
            <TextField
              autoFocus={Boolean(process.env.PLATFORM !== "ios" && props.initialPrimaryAsset)}
              error={Boolean(formik.errors.primaryAmountString && formik.touched.primaryAmountString)}
              name="primaryAmountString"
              inputProps={{
                pattern: "[0-9]*",
                inputMode: "decimal",
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
              label={
                formik.errors.primaryAmountString && formik.touched.primaryAmountString
                  ? formik.errors.primaryAmountString
                  : props.primaryAction === "buy"
                  ? "Amount to buy"
                  : "Amount to sell"
              }
              onBlur={formik.handleBlur}
              onChange={handlePrimaryAmountStringChange}
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
              inputError={
                formik.errors.manualPrice && formik.touched.manualPrice ? formik.errors.manualPrice : undefined
              }
              manualPrice={manualPrice !== undefined ? manualPrice : defaultPrice}
              onChange={handleManualPriceChange}
              onSetPriceDenotedIn={handlePriceModeChange}
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
              onBlur={formik.handleBlur}
              onChange={handleSecondaryAssetChange}
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
              style={{ flexGrow: 1, flexShrink: 1, width: "55%" }}
              inputMode="decimal"
              type="number"
              value={
                // Format amount without thousands grouping, since it may lead to illegal number input values (#831)
                bigNumberToInputValue(secondaryAmount, { groupThousands: false })
              }
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
              <ActionButton icon={<GavelIcon />} form={formID} type="submit">
                Place order
              </ActionButton>
            </DialogActionsBox>
          </Portal>
        </form>
      </VerticalLayout>
    </VerticalLayout>
  )
}

export default React.memo(TradingForm)

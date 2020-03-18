import BigNumber from "big.js"
import React from "react"
import { useTranslation } from "react-i18next"
import { useForm, Controller } from "react-hook-form"
import { Asset, Horizon, Transaction, Operation } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import ExpansionPanel from "@material-ui/core/ExpansionPanel"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import InputAdornment from "@material-ui/core/InputAdornment"
import makeStyles from "@material-ui/core/styles/makeStyles"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import GavelIcon from "@material-ui/icons/Gavel"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useHorizon } from "../../hooks/stellar"
import { useLiveOrderbook } from "../../hooks/stellar-subscriptions"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
import { AccountData } from "../../lib/account"
import { CustomError } from "../../lib/errors"
import { calculateSpread, FixedOrderbookRecord } from "../../lib/orderbook"
import { createTransaction } from "../../lib/transaction"
import { balancelineToAsset, getAccountMinimumBalance } from "../../lib/stellar"
import { formatBalance, BalanceFormattingOptions } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import AssetSelector from "../Form/AssetSelector"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { warningColor } from "../../theme"
import Portal from "../Portal"
import { useConversionOffers } from "./hooks"
import TradingPrice from "./TradingPrice"

const bigNumberToInputValue = (bignum: BigNumber, overrides?: BalanceFormattingOptions) =>
  formatBalance(bignum, { minimumSignificants: 3, maximumSignificants: 9, ...overrides })

const isValidAmount = (amount: string) => /^[0-9]+([\.,][0-9]+)?$/.test(amount)

function findMatchingBalance(balances: AccountData["balances"], asset: Asset) {
  return balances.find(balance => balancelineToAsset(balance).equals(asset))
}

const useStyles = makeStyles({
  expansionPanel: {
    background: "transparent",
    margin: "8px 0 !important",

    "&:before": {
      background: "transparent"
    }
  },
  expansionPanelSummary: {
    justifyContent: "flex-start",
    minHeight: "48px !important",
    padding: 0
  },
  expansionPanelSummaryContent: {
    flexGrow: 0,
    marginTop: "0 !important",
    marginBottom: "0 !important"
  },
  expansionPanelDetails: {
    justifyContent: "flex-start",
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 12
  }
})

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

const useCalculation = (
  values: TradingFormValues,
  tradePair: FixedOrderbookRecord,
  priceMode: "primary" | "secondary",
  accountData: AccountData,
  primaryAction: "buy" | "sell"
): CalculationResults => {
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

interface TradingFormValues {
  primaryAsset: Asset | undefined
  primaryAmountString: string
  secondaryAsset: Asset
  manualPrice: string
}

interface Props {
  account: Account
  accountData: AccountData
  className?: string
  dialogActionsRef: RefStateObject
  initialPrimaryAsset?: Asset
  primaryAction: "buy" | "sell"
  sendTransaction: (transaction: Transaction) => void
  style?: React.CSSProperties
  trustlines: Horizon.BalanceLineAsset[]
}

function TradingForm(props: Props) {
  const classes = useStyles()
  const isSmallScreen = useIsMobile()
  const isSmallHeightScreen = useMediaQuery("(max-height: 500px)")
  const isSmallScreenXY = isSmallScreen || isSmallHeightScreen
  const { t } = useTranslation()

  const [expanded, setExpanded] = React.useState(false)
  const [priceMode, setPriceMode] = React.useState<"primary" | "secondary">("secondary")

  const { control, errors, formState, getValues, handleSubmit, register, setValue, triggerValidation, watch } = useForm<
    TradingFormValues
  >({
    defaultValues: {
      primaryAsset: props.initialPrimaryAsset,
      primaryAmountString: "",
      secondaryAsset: Asset.native(),
      manualPrice: "0"
    }
  })

  const sendTransaction = props.sendTransaction
  const { primaryAsset, secondaryAsset } = watch()

  const horizon = useHorizon(props.account.testnet)
  const tradePair = useLiveOrderbook(primaryAsset || Asset.native(), secondaryAsset, props.account.testnet)

  const assets = React.useMemo(() => props.trustlines.map(balancelineToAsset), [props.trustlines])

  const calculation = useCalculation(getValues(), tradePair, priceMode, props.accountData, props.primaryAction)

  const {
    maxPrimaryAmount,
    primaryBalance,
    defaultPrice,
    effectivePrice,
    primaryAmount,
    relativeSpread,
    secondaryAmount,
    secondaryBalance,
    spendablePrimaryBalance,
    spendableSecondaryBalance
  } = calculation

  if (formState.touched.primaryAmountString) {
    // trigger delayed validation to make sure that primaryAmountString is validated with latest calculation results
    setTimeout(() => triggerValidation("primaryAmountString"), 0)
  }

  const setPrimaryAmountToMax = () => {
    setValue("primaryAmount", maxPrimaryAmount.toFixed(7))
  }

  const submitForm = React.useCallback(async () => {
    try {
      if (!primaryAsset) {
        throw CustomError(
          "InvariantViolationError",
          "Invariant violation: Should not be able to submit form without having selected the primary asset.",
          { message: "Should not be able to submit form without having selected the primary asset." }
        )
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
      sendTransaction(tx)
    } catch (error) {
      trackError(error)
    }
  }, [
    effectivePrice,
    horizon,
    primaryAsset,
    props.account,
    props.accountData,
    props.primaryAction,
    primaryAmount,
    secondaryAsset,
    sendTransaction
  ])

  return (
    // set minHeight to prevent wrapping of layout when keyboard is shown
    <VerticalLayout
      alignItems="stretch"
      alignSelf={isSmallScreenXY ? undefined : "center"}
      grow={1}
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
        <HorizontalLayout margin="8px 0">
          <Controller
            as={AssetSelector}
            assets={assets}
            autoFocus={Boolean(process.env.PLATFORM !== "ios" && !props.initialPrimaryAsset)}
            control={control}
            inputError={errors.primaryAsset && errors.primaryAsset.message}
            label={
              props.primaryAction === "buy"
                ? t("trading.inputs.primary-asset-selector.label.buy")
                : t("trading.inputs.primary-asset-selector.label.sell")
            }
            minWidth={75}
            name="primaryAsset"
            rules={{
              required: t<string>("trading.validation.primary-asset-missing")
            }}
            showXLM
            style={{ flexGrow: 1, marginRight: 24, maxWidth: 150, width: "25%" }}
            testnet={props.account.testnet}
            value={primaryAsset}
          />
          <TextField
            autoFocus={Boolean(process.env.PLATFORM !== "ios" && props.initialPrimaryAsset)}
            name="primaryAmountString"
            inputRef={register({
              required: t<string>("trading.validation.primary-amount-missing"),
              validate: value => {
                const amountInvalid =
                  primaryAmount.lt(0) ||
                  (value.length > 0 && primaryAmount.eq(0)) ||
                  (props.primaryAction === "sell" && primaryBalance && primaryAmount.gt(spendablePrimaryBalance)) ||
                  (props.primaryAction === "buy" && secondaryBalance && secondaryAmount.gt(spendableSecondaryBalance))
                return !amountInvalid || t<string>("trading.validation.invalid-amount")
              }
            })}
            error={Boolean(errors.primaryAmountString)}
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
                      {t("trading.inputs.primary-amount.max-button.label")}
                    </Button>
                  </InputAdornment>
                )
            }}
            label={
              errors.primaryAmountString && errors.primaryAmountString.message
                ? errors.primaryAmountString.message
                : props.primaryAction === "buy"
                ? t("trading.inputs.primary-amount.label.buy")
                : t("trading.inputs.primary-amount.label.sell")
            }
            placeholder={t(
              "trading.inputs.primary-amount.placeholder",
              `Max. ${bigNumberToInputValue(maxPrimaryAmount)}`,
              {
                amount: bigNumberToInputValue(maxPrimaryAmount)
              }
            )}
            required
            style={{ flexGrow: 1, flexShrink: 1, width: "55%" }}
            type="number"
          />
        </HorizontalLayout>
        <HorizontalLayout margin="8px 0 32px">
          <Controller
            as={AssetSelector}
            assets={assets}
            control={control}
            label={
              props.primaryAction === "buy"
                ? t("trading.inputs.secondary-asset-selector.label.buy")
                : t("trading.inputs.secondary-asset-selector.label.sell")
            }
            minWidth={75}
            name="secondaryAsset"
            rules={{ required: t<string>("trading.validation.secondary-asset-missing") }}
            showXLM
            style={{ flexGrow: 1, marginRight: 24, maxWidth: 150, width: "25%" }}
            testnet={props.account.testnet}
            value={secondaryAsset}
          />
          <ReadOnlyTextfield
            disableUnderline
            inputProps={{
              style: { height: 27 }
            }}
            label={
              props.primaryAction === "buy"
                ? t("trading.inputs.estimated-costs.label.buy")
                : t("trading.inputs.estimated-costs.label.sell")
            }
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
        <ExpansionPanel
          className={classes.expansionPanel}
          elevation={0}
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
        >
          <ExpansionPanelSummary
            classes={{ root: classes.expansionPanelSummary, content: classes.expansionPanelSummaryContent }}
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography align="center" style={{ flexGrow: 1 }}>
              {t("trading.advanced.header")}
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className={classes.expansionPanelDetails}>
            <Controller
              as={TradingPrice}
              control={control}
              defaultPrice={!formState.touched.manualPrice ? defaultPrice : undefined}
              inputError={errors.manualPrice && errors.manualPrice.message}
              name="manualPrice"
              onSetPriceDenotedIn={setPriceMode}
              price={effectivePrice}
              priceDenotedIn={priceMode}
              primaryAsset={primaryAsset}
              rules={{ validate: value => isValidAmount(value) || t<string>("trading.validation.invalid-price") }}
              secondaryAsset={secondaryAsset}
              selectOnFocus
              style={{ flexGrow: 1, maxWidth: 250, width: "55%" }}
              valueName="manualPrice"
            />
          </ExpansionPanelDetails>
        </ExpansionPanel>
        {relativeSpread >= 0.015 ? (
          <Box margin="32px 0 0" padding="8px 12px" style={{ background: warningColor }}>
            <b>{t("trading.warning.title")}</b>
            <br />
            {t(
              "trading.warning.message",
              `The spread between buying and selling price is about ${(relativeSpread * 100).toFixed(1)}%.`,
              { spread: (relativeSpread * 100).toFixed(1) }
            )}
          </Box>
        ) : null}
        <Portal target={props.dialogActionsRef.element}>
          <DialogActionsBox desktopStyle={{ marginTop: 32 }}>
            <ActionButton icon={<GavelIcon />} onClick={handleSubmit(submitForm)} type="primary">
              {t("trading.actions.submit")}
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </VerticalLayout>
    </VerticalLayout>
  )
}

export default React.memo(TradingForm)

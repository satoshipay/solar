import BigNumber from "big.js"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Asset, Horizon, Operation, Transaction } from "stellar-sdk"
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
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import { warningColor } from "~App/theme"
import AssetSelector from "~Generic/components/AssetSelector"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { ReadOnlyTextfield } from "~Generic/components/FormFields"
import Portal from "~Generic/components/Portal"
import { useHorizon } from "~Generic/hooks/stellar"
import { useLiveOrderbook } from "~Generic/hooks/stellar-subscriptions"
import { RefStateObject, useIsMobile } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { CustomError } from "~Generic/lib/errors"
import {
  balancelineToAsset,
  findMatchingBalanceLine,
  getAccountMinimumBalance,
  getSpendableBalance
} from "~Generic/lib/stellar"
import { createTransaction } from "~Generic/lib/transaction"
import { Box, HorizontalLayout, VerticalLayout } from "~Layout/components/Box"
import { bigNumberToInputValue, TradingFormValues, useCalculation } from "../hooks/form"
import TradingPrice from "./TradingPrice"
import { isValidAmount, replaceCommaWithDot } from "~Generic/lib/strings"

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

interface Props {
  account: Account
  accountData: AccountData
  className?: string
  dialogActionsRef: RefStateObject | null
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
  const [pending, setPending] = React.useState(false)

  const form = useForm<TradingFormValues>({
    defaultValues: {
      primaryAsset: props.initialPrimaryAsset,
      primaryAmountString: "",
      secondaryAsset: Asset.native(),
      manualPrice: "0"
    }
  })

  const sendTransaction = props.sendTransaction
  const { primaryAsset, secondaryAsset, manualPrice } = form.watch()

  React.useEffect(() => {
    if (!primaryAsset && props.initialPrimaryAsset) {
      form.setValue("primaryAsset", props.initialPrimaryAsset)
    }
  }, [form, primaryAsset, props.initialPrimaryAsset])

  const horizon = useHorizon(props.account.testnet)
  const tradePair = useLiveOrderbook(primaryAsset || Asset.native(), secondaryAsset, props.account.testnet)

  const assets = React.useMemo(() => props.trustlines.map(balancelineToAsset), [props.trustlines])

  const calculation = useCalculation({
    accountData: props.accountData,
    priceMode,
    primaryAction: props.primaryAction,
    tradePair,
    values: form.getValues()
  })

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

  if (form.formState.touched.primaryAmountString) {
    // trigger delayed validation to make sure that primaryAmountString is validated with latest calculation results
    setTimeout(() => form.triggerValidation("primaryAmountString"), 0)
  }

  const setPrimaryAmountToMax = () => {
    form.setValue("primaryAmountString", maxPrimaryAmount.toFixed(7))
  }

  const validateManualPrice = React.useCallback(() => {
    const dottedManualPrice = replaceCommaWithDot(manualPrice)
    const value = BigNumber(dottedManualPrice).gt(0) ? dottedManualPrice : defaultPrice
    const valid = isValidAmount(value) && BigNumber(value).gt(0)
    if (!valid) {
      if (!expanded) {
        setExpanded(true)
      }
      return t<string>("trading.validation.invalid-price")
    }
  }, [defaultPrice, expanded, manualPrice, t])

  const submitForm = React.useCallback(async () => {
    try {
      setPending(true)

      const error = validateManualPrice()
      if (error) {
        form.setError("manualPrice", "invalid-amount", error)
        return
      }

      if (!primaryAsset) {
        throw CustomError(
          "InvariantViolationError",
          "Invariant violation: Should not be able to submit form without having selected the primary asset.",
          { message: "Should not be able to submit form without having selected the primary asset." }
        )
      }

      const spendableXLMBalance = getSpendableBalance(
        getAccountMinimumBalance(props.accountData),
        findMatchingBalanceLine(props.accountData.balances, Asset.native())
      )
      if (spendableXLMBalance.minus(0.5).cmp(0) <= 0) {
        throw CustomError("LowReserveOrderError", "Cannot place order because spendable XLM balance is too low.")
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
      await sendTransaction(tx)
    } catch (error) {
      trackError(error)
    } finally {
      setPending(false)
    }
  }, [
    form,
    effectivePrice,
    horizon,
    primaryAsset,
    props.account,
    props.accountData,
    props.primaryAction,
    primaryAmount,
    secondaryAsset,
    sendTransaction,
    validateManualPrice
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
            as={
              <AssetSelector
                assets={assets}
                inputError={form.errors.primaryAsset && form.errors.primaryAsset.message}
                label={
                  props.primaryAction === "buy"
                    ? t("trading.inputs.primary-asset-selector.label.buy")
                    : t("trading.inputs.primary-asset-selector.label.sell")
                }
                minWidth={75}
                showXLM
                style={{ flexGrow: 1, marginRight: 24, maxWidth: 150, width: "25%" }}
                testnet={props.account.testnet}
                value={primaryAsset}
              />
            }
            control={form.control}
            name="primaryAsset"
            rules={{
              required: t<string>("trading.validation.primary-asset-missing")
            }}
          />
          <TextField
            name="primaryAmountString"
            inputRef={form.register({
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
            error={Boolean(form.errors.primaryAmountString)}
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
              form.errors.primaryAmountString && form.errors.primaryAmountString.message
                ? form.errors.primaryAmountString.message
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
          />
        </HorizontalLayout>
        <HorizontalLayout margin="8px 0 32px">
          <Controller
            as={
              <AssetSelector
                assets={assets}
                label={
                  props.primaryAction === "buy"
                    ? t("trading.inputs.secondary-asset-selector.label.buy")
                    : t("trading.inputs.secondary-asset-selector.label.sell")
                }
                minWidth={75}
                showXLM
                style={{ flexGrow: 1, marginRight: 24, maxWidth: 150, width: "25%" }}
                testnet={props.account.testnet}
                value={secondaryAsset}
              />
            }
            control={form.control}
            name="secondaryAsset"
            rules={{ required: t<string>("trading.validation.secondary-asset-missing") }}
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
              as={
                <TradingPrice
                  defaultPrice={!form.formState.touched.manualPrice ? defaultPrice : undefined}
                  inputError={form.errors.manualPrice && form.errors.manualPrice.message}
                  onSetPriceDenotedIn={setPriceMode}
                  priceDenotedIn={priceMode}
                  primaryAsset={primaryAsset}
                  secondaryAsset={secondaryAsset}
                  selectOnFocus
                  style={{ flexGrow: 1, maxWidth: 250, width: "55%" }}
                />
              }
              control={form.control}
              name="manualPrice"
              rules={{
                validate: value => {
                  const valid = isValidAmount(value)
                  return valid || t<string>("trading.validation.invalid-price")
                }
              }}
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
        <Portal target={props.dialogActionsRef?.element}>
          <DialogActionsBox desktopStyle={{ marginTop: 32 }}>
            <ActionButton loading={pending} icon={<GavelIcon />} onClick={form.handleSubmit(submitForm)} type="primary">
              {t("trading.action.submit")}
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </VerticalLayout>
    </VerticalLayout>
  )
}

export default React.memo(TradingForm)

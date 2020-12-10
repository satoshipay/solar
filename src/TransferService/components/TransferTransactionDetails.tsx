import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { useTranslation } from "react-i18next"
import { Transaction } from "stellar-sdk"
import SendIcon from "@material-ui/icons/Send"
import {
  Deposit,
  Withdrawal,
  WithdrawalInstructionsSuccess,
  DepositInstructionsSuccess
} from "@satoshipay/stellar-transfer"
import { trackError } from "~App/contexts/notifications"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { RefStateObject } from "~Generic/hooks/userinterface"
import { useLoadingState } from "~Generic/hooks/util"
import { useStellarToml } from "~Generic/hooks/stellar"
import { findMatchingBalanceLine } from "~Generic/lib/stellar"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { PriceInput, ReadOnlyTextfield } from "~Generic/components/FormFields"
import Portal from "~Generic/components/Portal"
import { formatBalance } from "~Generic/lib/balances"
import { formatBalanceRange, formatDescriptionText, formatDuration } from "../util/formatters"
import { TransferStates } from "../util/statemachine"
import { WithdrawalActions } from "../hooks/useWithdrawalState"
import { DepositContext } from "./DepositProvider"
import FormLayout from "./FormLayout"
import { Paragraph, Summary } from "./Sidebar"
import { WithdrawalContext } from "./WithdrawalProvider"

const nullOrUndefined = (value: any): value is null | undefined => value === null || value === undefined

interface TransferTransactionDetailsProps {
  dialogActionsRef: RefStateObject | undefined
  sendTransaction: (transaction: Transaction) => Promise<any>
  state: TransferStates.EnterTxDetails<Deposit | Withdrawal>
  type: "deposit" | "withdrawal"
}

function TransferTransactionDetails(props: TransferTransactionDetailsProps) {
  const { sendTransaction } = props
  const { account, actions } =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    props.type === "deposit" ? React.useContext(DepositContext) : React.useContext(WithdrawalContext)
  const { asset } = (props.state.deposit || props.state.withdrawal) as Deposit | Withdrawal
  const { t } = useTranslation()

  const formID = React.useMemo(() => nanoid(), [])
  const accountData = useLiveAccountData(account.publicKey, account.testnet)
  const amountIn = props.state.transfer ? props.state.transfer.amount_in : ""

  const [amountString, setAmountString] = React.useState(amountIn || "")
  const [txPreparationState, handleTxPreparation] = useLoadingState({ throwOnError: true })

  const balanceLine = findMatchingBalanceLine(accountData.balances, asset)
  const balance = balanceLine ? BigNumber(balanceLine.balance) : BigNumber(0)

  const data = props.state.response.data
  const minAmount = data.min_amount ? BigNumber(data.min_amount) : undefined
  const maxAmount = data.max_amount ? BigNumber(data.max_amount) : undefined

  const amount = amountString.match(/^[0-9]+(\.[0-9]+)?$/) ? BigNumber(amountString) : BigNumber(0)
  const eta = data.eta ? formatDuration(data.eta) : t("transfer-service.transaction-details.body.eta.not-available")

  const isAmountOutOfBounds = (minAmount && amount.lt(minAmount)) || (maxAmount && amount.gt(maxAmount))
  const isDisabled = props.type === "withdrawal" ? !amount.gt(0) || amount.gt(balance) || isAmountOutOfBounds : false

  const stellarToml = useStellarToml(props.state.withdrawal?.transferServer.domain)
  const isSEP24Anchor = Boolean(stellarToml && stellarToml.TRANSFER_SERVER_SEP0024)

  const fees = BigNumber(data.fee_fixed || 0).add(
    BigNumber(data.fee_percent || 0)
      .div(100)
      .mul(amount)
  )
  const feeMaxDecimals = fees.round(2).eq(fees) ? 2 : undefined
  const feesUnknown = nullOrUndefined(data.fee_fixed) && nullOrUndefined(data.fee_percent)

  const handleSubmit = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault()

      if (props.type === "deposit") {
        actions.afterSuccessfulExecution(amount)
      } else {
        handleTxPreparation(
          (async () => {
            try {
              const tx = await (actions as WithdrawalActions).prepareWithdrawalTransaction(
                props.state.withdrawal!,
                props.state.response as WithdrawalInstructionsSuccess,
                amount
              )
              await sendTransaction(tx)
              actions.afterSuccessfulExecution(amount)
            } catch (error) {
              trackError(error)
            }
          })()
        )
      }
    },
    [actions, amount, handleTxPreparation, props.state, props.type, sendTransaction]
  )

  const extraInfo =
    data.extra_info && typeof data.extra_info === "string"
      ? { message: data.extra_info as string }
      : data.extra_info || {}

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <FormLayout wrap>
        {props.type === "deposit" && (props.state.response as DepositInstructionsSuccess).data.how ? (
          <ReadOnlyTextfield
            label={t("transfer-service.transaction-details.body.deposit-instructions.label")}
            multiline
            value={(props.state.response as DepositInstructionsSuccess).data.how}
          />
        ) : null}
        {props.type === "deposit" ? null : (
          <PriceInput
            assetCode={asset.getCode()}
            disabled={isSEP24Anchor || (minAmount && minAmount.gt(balance))}
            error={amount.gt(balance) || (minAmount && minAmount.gt(balance))}
            label={t("transfer-service.transaction-details.body.amount.label.withdrawal")}
            helperText={
              amount.gt(balance) &&
              t("transfer-service.transaction-details.body.amount.error.amount-greater-than-balance")
            }
            margin="normal"
            onChange={event => setAmountString(event.target.value)}
            placeholder={formatBalanceRange(balance, minAmount, maxAmount)}
            style={{ marginTop: 24 }}
            value={amountString}
          />
        )}
        <PriceInput
          assetCode={asset.getCode()}
          disabled
          label={t("transfer-service.transaction-details.body.fees.label")}
          margin="normal"
          readOnly
          style={{ marginTop: 24 }}
          value={
            feesUnknown
              ? t("transfer-service.transaction-details.body.fees.value.unknown")
              : `- ${formatBalance(fees, { maximumDecimals: feeMaxDecimals })}`
          }
        />
        <PriceInput
          assetCode={asset.getCode()}
          disabled
          label={t("transfer-service.transaction-details.body.amount-to-receive.label")}
          readOnly
          style={{ marginTop: 24 }}
          value={amount.minus(fees).lte(0) ? "-" : formatBalance(amount.minus(fees))}
        />
        <ReadOnlyTextfield
          label={t("transfer-service.transaction-details.body.eta.label")}
          style={{ marginTop: 24 }}
          value={eta}
        />
        {Object.keys(extraInfo).map((extraKey, index) => (
          <ReadOnlyTextfield
            key={index}
            label={
              Object.keys(extraInfo).length === 1
                ? t("transfer-service.transaction-details.body.information.label")
                : formatDescriptionText(extraKey)
            }
            style={{ marginTop: 24 }}
            value={extraInfo[extraKey]}
          />
        ))}
        <Portal desktop="inline" target={props.dialogActionsRef && props.dialogActionsRef.element}>
          <DialogActionsBox>
            <ActionButton
              disabled={isDisabled}
              form={formID}
              icon={props.type === "deposit" ? null : <SendIcon />}
              loading={txPreparationState.type === "pending"}
              onClick={() => undefined}
              type="submit"
            >
              {props.type === "deposit"
                ? t("transfer-service.transaction-details.action.done")
                : t("transfer-service.transaction-details.action.withdraw")}
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </FormLayout>
    </form>
  )
}

const Sidebar = (props: { type: "deposit" | "withdrawal" }) => {
  const { t } = useTranslation()
  return props.type === "deposit" ? (
    <Summary headline={t("transfer-service.transaction-details.sidebar.deposit.headline")}>
      <Paragraph>{t("transfer-service.transaction-details.sidebar.deposit.info.1")}</Paragraph>
      <Paragraph>{t("transfer-service.transaction-details.sidebar.deposit.info.2")}</Paragraph>
    </Summary>
  ) : (
    <Summary headline={t("transfer-service.transaction-details.sidebar.withdrawal.headline")}>
      <Paragraph>{t("transfer-service.transaction-details.sidebar.withdrawal.info.1")}</Paragraph>
      <Paragraph>{t("transfer-service.transaction-details.sidebar.withdrawal.info.2")}</Paragraph>
    </Summary>
  )
}

const TransactionDetailsView = Object.assign(React.memo(TransferTransactionDetails), { Sidebar })

export default TransactionDetailsView

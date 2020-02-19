import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { Transaction } from "stellar-sdk"
import SendIcon from "@material-ui/icons/Send"
import {
  Deposit,
  Withdrawal,
  WithdrawalInstructionsSuccess,
  DepositInstructionsSuccess
} from "@satoshipay/stellar-transfer"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { RefStateObject } from "../../hooks/userinterface"
import { useLoadingState } from "../../hooks/util"
import { findMatchingBalanceLine } from "../../lib/stellar"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { PriceInput, ReadOnlyTextfield } from "../Form/FormFields"
import Portal from "../Portal"
import { formatBalanceRange, formatDescriptionText, formatDuration } from "./formatters"
import { TransferStates } from "./statemachine"
import { WithdrawalActions } from "./useWithdrawalState"
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
  const { account, actions } =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    props.type === "deposit" ? React.useContext(DepositContext) : React.useContext(WithdrawalContext)
  const { asset } = (props.state.deposit || props.state.withdrawal) as Deposit | Withdrawal

  const formID = React.useMemo(() => nanoid(), [])
  const accountData = useLiveAccountData(account.publicKey, account.testnet)
  const amountIn = props.state.transfer ? props.state.transfer.amount_in : ""

  const [amountString, setAmountString] = React.useState(amountIn || "")
  const [txPreparationState, handleTxPreparation] = useLoadingState({ throwOnError: true })

  const balanceLine = findMatchingBalanceLine(accountData.balances, asset)
  const balance = balanceLine ? BigNumber(balanceLine.balance) : BigNumber(0)

  const data = props.state.response.data
  const minAmount = data.min_amount ? BigNumber(data.min_amount) : undefined
  const maxAmount = data.max_amount ? BigNumber(data.max_amount) : balance

  const amount = amountString.match(/^[0-9]+(\.[0-9]+)?$/) ? BigNumber(amountString) : BigNumber(0)
  const eta = data.eta ? formatDuration(data.eta) : "N/A"

  const isAmountOutOfBounds = (minAmount && amount.lt(minAmount)) || (maxAmount && amount.gt(maxAmount))
  const isDisabled = !amount.gt(0) || amount.gt(balance) || isAmountOutOfBounds

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
            const tx = await (actions as WithdrawalActions).prepareWithdrawalTransaction(
              props.state.withdrawal!,
              props.state.response as WithdrawalInstructionsSuccess,
              amount
            )
            await props.sendTransaction(tx)
            actions.afterSuccessfulExecution(amount)
          })()
        )
      }
    },
    [props, actions, amount, handleTxPreparation]
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
            label="Deposit instructions"
            multiline
            value={(props.state.response as DepositInstructionsSuccess).data.how}
          />
        ) : null}
        <PriceInput
          assetCode={asset.getCode()}
          autoFocus
          disabled={minAmount && minAmount.gt(balance)}
          error={minAmount && minAmount.gt(balance)}
          label={props.type === "deposit" ? "Amount to deposit" : "Amount to withdraw"}
          margin="normal"
          onChange={event => setAmountString(event.target.value)}
          placeholder={formatBalanceRange(balance, minAmount, maxAmount)}
          style={{ marginTop: 24 }}
          value={amountString}
        />
        <PriceInput
          assetCode={asset.getCode()}
          disabled
          label="Fees"
          margin="normal"
          readOnly
          style={{ marginTop: 24 }}
          value={feesUnknown ? "unknown" : `- ${formatBalance(fees, { maximumDecimals: feeMaxDecimals })}`}
        />
        <PriceInput
          assetCode={asset.getCode()}
          disabled
          label="Amount to receive"
          readOnly
          style={{ marginTop: 24 }}
          value={amount.minus(fees).lte(0) ? "-" : formatBalance(amount.minus(fees))}
        />
        <ReadOnlyTextfield label="ETA" style={{ marginTop: 24 }} value={eta} />
        {Object.keys(extraInfo).map((extraKey, index) => (
          <ReadOnlyTextfield
            key={index}
            label={Object.keys(extraInfo).length === 1 ? "Information" : formatDescriptionText(extraKey)}
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
              {props.type === "deposit" ? "Done" : "Withdraw"}
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </FormLayout>
    </form>
  )
}

const Sidebar = (props: { type: "deposit" | "withdrawal" }) =>
  props.type === "deposit" ? (
    <Summary headline="Deposit summary">
      <Paragraph>Make sure that you send the funds to the right destination.</Paragraph>
      <Paragraph>The asset issuer will credit the tokens once your deposit is credited.</Paragraph>
    </Summary>
  ) : (
    <Summary headline="Almost done">
      <Paragraph>Check the form and provide an amount to withdraw if necessary.</Paragraph>
      <Paragraph>The withdrawal is almost ready.</Paragraph>
    </Summary>
  )

const TransactionDetailsView = Object.assign(React.memo(TransferTransactionDetails), { Sidebar })

export default TransactionDetailsView

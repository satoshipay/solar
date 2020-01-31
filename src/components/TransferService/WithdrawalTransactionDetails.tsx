import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { Transaction } from "stellar-sdk"
import SendIcon from "@material-ui/icons/Send"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { RefStateObject } from "../../hooks/userinterface"
import { useLoadingState } from "../../hooks/util"
import { findMatchingBalanceLine } from "../../lib/stellar"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { PriceInput, ReadOnlyTextfield } from "../Form/FormFields"
import { HorizontalLayout } from "../Layout/Box"
import Portal from "../Portal"
import { formatBalanceRange, formatDescriptionText, formatDuration } from "./formatters"
import { WithdrawalStates } from "./statemachine"
import FormLayout from "./FormLayout"
import { WithdrawalContext } from "./WithdrawalProvider"
import { FormBuilderField } from "./FormBuilder"

interface WithdrawalTransactionDetailsProps {
  dialogActionsRef: RefStateObject | undefined
  sendTransaction: (transaction: Transaction) => Promise<any>
  state: WithdrawalStates.EnterTxDetails
}

function WithdrawalTransactionDetails(props: WithdrawalTransactionDetailsProps) {
  const { account, actions } = React.useContext(WithdrawalContext)
  const { asset } = props.state.withdrawal

  const formID = React.useMemo(() => nanoid(), [])
  const accountData = useLiveAccountData(account.publicKey, account.testnet)
  const [amountString, setAmountString] = React.useState("")
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

  const handleSubmit = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault()

      handleTxPreparation(
        (async () => {
          const tx = await actions.prepareWithdrawalTransaction(props.state.withdrawal, props.state.response, amount)
          await props.sendTransaction(tx)
          actions.afterSuccessfulExecution(amount)
        })()
      )
    },
    [actions.afterSuccessfulExecution, actions.prepareWithdrawalTransaction, props.sendTransaction, props.state, amount]
  )

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <FormLayout wrap>
        <PriceInput
          assetCode={asset.getCode()}
          autoFocus
          disabled={minAmount && minAmount.gt(balance)}
          error={minAmount && minAmount.gt(balance)}
          label="Amount to withdraw"
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
          value={`- ${formatBalance(fees, { maximumDecimals: feeMaxDecimals })}`}
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
        {data.extra_info && typeof data.extra_info === "string" ? (
          <ReadOnlyTextfield label="Information" style={{ marginTop: 24 }} value={data.extra_info} />
        ) : (
          Object.keys(data.extra_info || {}).map(extraKey => (
            <ReadOnlyTextfield
              label={formatDescriptionText(extraKey)}
              style={{ marginTop: 24 }}
              value={data.extra_info![extraKey]}
            />
          ))
        )}
        <Portal desktop="inline" target={props.dialogActionsRef && props.dialogActionsRef.element}>
          <DialogActionsBox>
            <ActionButton
              disabled={isDisabled}
              form={formID}
              icon={<SendIcon />}
              loading={txPreparationState.type === "pending"}
              onClick={() => undefined}
              type="submit"
            >
              Withdraw
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </FormLayout>
    </form>
  )
}

export default React.memo(WithdrawalTransactionDetails)

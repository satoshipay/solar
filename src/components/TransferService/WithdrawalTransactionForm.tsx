import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { Asset } from "stellar-sdk"
import SendIcon from "@material-ui/icons/Send"
import { WithdrawalSuccessResponse } from "@satoshipay/stellar-sep-6"
import { Account } from "../../context/accounts"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { RefStateObject } from "../../hooks/userinterface"
import { findMatchingBalanceLine } from "../../lib/stellar"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { PriceInput, ReadOnlyTextfield } from "../Form/FormFields"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { formatBalanceRange, formatDescriptionText, formatDuration } from "./formatters"
import Portal from "../Portal"

interface Props {
  account: Account
  actionsRef: RefStateObject
  asset: Asset
  anchorResponse: WithdrawalSuccessResponse
  onCancel: () => void
  onSubmit: (amount: BigNumber, asset: Asset, response: WithdrawalSuccessResponse) => void
}

function WithdrawalTransactionForm(props: Props) {
  const formID = React.useMemo(() => nanoid(), [])
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const [amountString, setAmountString] = React.useState("")

  const balanceLine = findMatchingBalanceLine(accountData.balances, props.asset)
  const balance = balanceLine ? BigNumber(balanceLine.balance) : BigNumber(0)

  const data = props.anchorResponse
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
      props.onSubmit(amount, props.asset, props.anchorResponse)
    },
    [props.onSubmit, amount]
  )

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <VerticalLayout>
        <HorizontalLayout>
          <PriceInput
            assetCode={props.asset.getCode()}
            autoFocus
            disabled={minAmount && minAmount.gt(balance)}
            label="Amount to withdraw"
            margin="normal"
            onChange={event => setAmountString(event.target.value)}
            placeholder={formatBalanceRange(balance, minAmount, maxAmount)}
            style={{ flexGrow: 2, marginRight: 24 }}
            value={amountString}
          />
          <PriceInput
            assetCode={props.asset.getCode()}
            label="Fees"
            margin="normal"
            readOnly
            style={{ flexGrow: 0, width: 160 }}
            value={`- ${formatBalance(fees, { maximumDecimals: feeMaxDecimals })}`}
          />
        </HorizontalLayout>
        <HorizontalLayout margin="24px 0 0">
          <PriceInput
            assetCode={props.asset.getCode()}
            label="Amount to receive"
            readOnly
            style={{ flexGrow: 2, marginRight: 24 }}
            value={amount.minus(fees).lte(0) ? "-" : formatBalance(amount.minus(fees))}
          />
          <ReadOnlyTextfield label="ETA" style={{ flexGrow: 0, width: 160 }} value={eta} />
        </HorizontalLayout>
        {data.extra_info && typeof data.extra_info === "string" ? (
          <ReadOnlyTextfield label="Information" value={data.extra_info} />
        ) : (
          Object.keys(data.extra_info || {}).map(extraKey => (
            <ReadOnlyTextfield label={formatDescriptionText(extraKey)} value={data.extra_info![extraKey]} />
          ))
        )}
        <HorizontalLayout margin="24px 0 64px">{null}</HorizontalLayout>
        <Portal target={props.actionsRef.element}>
          <DialogActionsBox>
            <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
            <ActionButton
              disabled={isDisabled}
              form={formID}
              icon={<SendIcon />}
              onClick={() => undefined}
              type="submit"
            >
              Withdraw
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </VerticalLayout>
    </form>
  )
}

export default React.memo(WithdrawalTransactionForm)

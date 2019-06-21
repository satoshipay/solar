import BigNumber from "big.js"
import React from "react"
import { Asset } from "stellar-sdk"
import SendIcon from "@material-ui/icons/Send"
import { WithdrawalSuccessResponse } from "@satoshipay/stellar-sep-6"
import { Account } from "../../context/accounts"
import { useAccountData } from "../../hooks"
import { getMatchingAccountBalance } from "../../lib/stellar"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { PriceInput, ReadOnlyTextfield } from "../Form/FormFields"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { formatBalanceRange, formatDescriptionText, formatDuration } from "./formatters"

interface Props {
  account: Account
  asset: Asset
  anchorResponse: WithdrawalSuccessResponse
  onCancel: () => void
  onSubmit: (amount: BigNumber, asset: Asset, response: WithdrawalSuccessResponse) => void
}

function WithdrawalTransactionForm(props: Props) {
  // TODO: extra_info is not handled

  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const [amountString, setAmountString] = React.useState("")

  const balance = getMatchingAccountBalance(accountData.balances, props.asset.getCode())
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
    <form onSubmit={handleSubmit}>
      <VerticalLayout>
        <HorizontalLayout>
          <PriceInput
            assetCode={props.asset.getCode()}
            autoFocus
            disabled={minAmount && minAmount.gt(balance)}
            label="Amount to withdraw"
            margin="normal"
            onChange={event => setAmountString(event.target.value)}
            placeholder={accountData.loading ? "" : formatBalanceRange(balance, minAmount, maxAmount)}
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
        {Object.keys(data.extra_info || {}).map(extraKey => (
          <ReadOnlyTextfield label={formatDescriptionText(extraKey)} value={data.extra_info[extraKey]} />
        ))}
        <HorizontalLayout margin="24px 0 64px">{null}</HorizontalLayout>
        <DialogActionsBox spacing="large">
          <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
          <ActionButton disabled={isDisabled} icon={<SendIcon />} onClick={() => undefined} type="submit">
            Withdraw
          </ActionButton>
        </DialogActionsBox>
      </VerticalLayout>
    </form>
  )
}

export default React.memo(WithdrawalTransactionForm)

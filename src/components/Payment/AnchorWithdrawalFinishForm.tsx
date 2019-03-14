import BigNumber from "big.js"
import React from "react"
import { Asset } from "stellar-sdk"
import SendIcon from "@material-ui/icons/Send"
import { WithdrawalRequestSuccess } from "@satoshipay/sep-6"
import { Account } from "../../context/accounts"
import { useAccountData } from "../../hooks"
import { getMatchingAccountBalance } from "../../lib/stellar"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { PriceInput, ReadOnlyTextfield } from "../Form/FormFields"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { formatBalanceRange, formatDuration } from "./formatters"

interface ExtraValues {
  [fieldName: string]: string
}

interface Props {
  account: Account
  asset: Asset
  anchorResponse: WithdrawalRequestSuccess
  onCancel: () => void
  onSubmit: (extraFields: ExtraValues) => void
}

function AnchorWithdrawalFinishForm(props: Props) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const [amountString, setAmountString] = React.useState("")

  const balance = getMatchingAccountBalance(accountData.balances, props.asset.getCode())
  const { data } = props.anchorResponse
  const minAmount = data.min_amount ? BigNumber(data.min_amount) : undefined
  const maxAmount = data.max_amount ? BigNumber(data.max_amount) : undefined

  const handleSubmit = () => {
    // FIXME
  }

  const amount = amountString.match(/^[0-9]+(\.[0-9]+)?$/) ? BigNumber(amountString) : BigNumber(0)
  const eta = data.eta ? formatDuration(data.eta) : "N/A"

  // FIXME
  const fees = BigNumber(data.fee_fixed || 0).add(
    BigNumber(data.fee_percent || 0)
      .div(100)
      .mul(amount)
  )

  // FIXME
  const isDisabled = true

  return (
    <form onSubmit={handleSubmit}>
      <VerticalLayout>
        <HorizontalLayout>
          <PriceInput
            assetCode={props.asset.getCode()}
            label="Amount to withdraw"
            onChange={event => setAmountString(event.target.value)}
            placeholder={accountData.loading ? "" : formatBalanceRange(balance, minAmount, maxAmount)}
            style={{ flexGrow: 2, marginRight: 24 }}
            value={amountString}
          />
          <PriceInput
            assetCode={props.asset.getCode()}
            label="Fees"
            readOnly
            style={{ flexGrow: 0, width: 160 }}
            value={formatBalance(fees)}
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
        {/* TODO: extra_fields */}
        <HorizontalLayout margin="24px 0 0">{null}</HorizontalLayout>
        <DialogActionsBox spacing="large" style={{ marginTop: 64 }}>
          <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
          <ActionButton disabled={isDisabled} icon={<SendIcon />} onClick={() => undefined} type="submit">
            Withdraw
          </ActionButton>
        </DialogActionsBox>
      </VerticalLayout>
    </form>
  )
}

export default AnchorWithdrawalFinishForm

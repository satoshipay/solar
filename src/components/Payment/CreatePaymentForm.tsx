import BigNumber from "big.js"
import React from "react"
import { Asset } from "stellar-sdk"
import FormControl from "@material-ui/core/FormControl"
import InputLabel from "@material-ui/core/InputLabel"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"
import TextField from "@material-ui/core/TextField"
import SendIcon from "@material-ui/icons/Send"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { Box, HorizontalLayout } from "../Layout/Box"
import { ObservedAccountData } from "../../hooks"
import { renderFormFieldError } from "../../lib/errors"
import { getMatchingAccountBalance, getAccountMinimumBalance } from "../../lib/stellar"
import { PriceInput } from "../Form/FormFields"

type MemoLabels = { [memoType in PaymentCreationValues["memoType"]]: string }

const memoInputLabels: MemoLabels = {
  id: "Integer identifier",
  none: "",
  text: "Memo"
}

export interface PaymentCreationValues {
  amount: string
  asset: string
  destination: string
  memoType: "id" | "none" | "text"
  memoValue: string
}

type PaymentCreationErrors = { [fieldName in keyof PaymentCreationValues]?: Error | null }

function validateFormValues(formValues: PaymentCreationValues, spendableBalance: BigNumber) {
  const errors: PaymentCreationErrors = {}

  if (!formValues.destination.match(/^(G[A-Z0-9]{55})|([^\*> \t\n\r]+\*[^\*\.> \t\n\r]+\.[^\*> \t\n\r]+)$/)) {
    errors.destination = new Error(`Expected a public key or stellar address.`)
  }
  if (!formValues.amount.match(/^[0-9]+(\.[0-9]+)?$/)) {
    errors.amount = new Error("Invalid amount.")
  } else if (spendableBalance.lt(formValues.amount)) {
    errors.amount = new Error("Not enough funds.")
  }

  if (formValues.memoType === "text") {
    if (formValues.memoValue.length === 0) {
      errors.memoValue = new Error('Memo cannot be empty, but can set memo type to "None".')
    } else if (formValues.memoValue.length > 28) {
      errors.memoValue = new Error("Memo too long.")
    }
  } else if (formValues.memoType === "id") {
    if (!formValues.memoValue.match(/^[0-9]+$/)) {
      errors.memoValue = new Error("Memo must be an integer.")
    }
  }

  const success = Object.keys(errors).length === 0
  return { errors, success }
}

interface AssetSelectorProps {
  assets: string[]
  onSelect: (assetCode: string) => void
  selected: string
  style: React.CSSProperties
}

function AssetSelector(props: AssetSelectorProps) {
  return (
    <FormControl>
      <Select
        disableUnderline
        onChange={event => props.onSelect(event.target.value)}
        style={props.style}
        value={props.selected}
      >
        {props.assets.map(assetCode => (
          <MenuItem key={assetCode} value={assetCode}>
            {assetCode}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

interface Props {
  accountData: ObservedAccountData
  trustedAssets: Asset[]
  txCreationPending?: boolean
  onCancel: () => void
  onSubmit?: (formValues: PaymentCreationValues) => any
}

function PaymentCreationForm(props: Props) {
  const { onSubmit = () => undefined } = props

  const [errors, setErrors] = React.useState<PaymentCreationErrors>({})
  const [formValues, setFormValues] = React.useState<PaymentCreationValues>({
    amount: "",
    asset: "XLM",
    destination: "",
    memoType: "none",
    memoValue: ""
  })

  const isDisabled = !formValues.amount || Number.isNaN(Number.parseFloat(formValues.amount)) || !formValues.destination
  const selectedAssetBalance = getMatchingAccountBalance(props.accountData.balances, formValues.asset)

  // FIXME: Pass no. of open offers to getAccountMinimumBalance()
  const spendableBalance =
    formValues.asset === "XLM"
      ? selectedAssetBalance.minus(getAccountMinimumBalance(props.accountData))
      : selectedAssetBalance

  const setFormValue = (fieldName: keyof PaymentCreationValues, value: string | null) => {
    setFormValues({
      ...formValues,
      [fieldName]: value
    })
  }

  const submit = (event: React.SyntheticEvent) => {
    event.preventDefault()
    const validation = validateFormValues(formValues, spendableBalance)
    setErrors(validation.errors)

    if (validation.success) {
      onSubmit(formValues)
    }
  }

  return (
    <form onSubmit={submit}>
      <TextField
        error={Boolean(errors.destination)}
        label={errors.destination ? renderFormFieldError(errors.destination) : "Destination address"}
        placeholder="GABCDEFGHIJK... or alice@example.org"
        fullWidth
        autoFocus
        margin="normal"
        value={formValues.destination}
        onChange={event => setFormValue("destination", event.target.value)}
      />
      <HorizontalLayout justifyContent="space-between" alignItems="center">
        <PriceInput
          assetCode={
            <AssetSelector
              assets={props.trustedAssets.map(asset => asset.code)}
              onSelect={code => setFormValue("asset", code)}
              selected={formValues.asset}
              style={{ alignSelf: "center" }}
            />
          }
          error={Boolean(errors.amount)}
          label={errors.amount ? renderFormFieldError(errors.amount) : "Amount"}
          margin="normal"
          placeholder={`Max. ${formatBalance(spendableBalance.toString())}`}
          value={formValues.amount}
          onChange={event => setFormValue("amount", event.target.value)}
          style={{
            minWidth: "30%"
          }}
        />
        <FormControl style={{ width: "30%" }}>
          <InputLabel htmlFor="select-memo-type" shrink>
            Memo type
          </InputLabel>
          <Select
            inputProps={{ id: "select-memo-type" }}
            onChange={event => setFormValue("memoType", event.target.value)}
            value={formValues.memoType}
            style={{ width: "100%" }}
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="id">ID</MenuItem>
          </Select>
        </FormControl>
      </HorizontalLayout>
      <Box>
        {formValues.memoType !== "none" ? (
          <TextField
            inputProps={{ maxLength: 28 }}
            error={Boolean(errors.memoValue)}
            label={errors.memoValue ? renderFormFieldError(errors.memoValue) : memoInputLabels[formValues.memoType]}
            margin="normal"
            onChange={event => setFormValue("memoValue", event.target.value)}
            value={formValues.memoValue}
            style={{ width: "70%" }}
          />
        ) : (
          <div />
        )}
      </Box>
      <DialogActionsBox spacing="large" style={{ marginTop: 64 }}>
        <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
        <ActionButton
          disabled={isDisabled}
          icon={<SendIcon style={{ fontSize: 16 }} />}
          loading={props.txCreationPending}
          onClick={() => undefined}
          type="submit"
        >
          Send
        </ActionButton>
      </DialogActionsBox>
    </form>
  )
}

export default PaymentCreationForm

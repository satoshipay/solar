import BigNumber from "big.js"
import React from "react"
import { Asset } from "stellar-sdk"
import FormControl from "@material-ui/core/FormControl"
import InputAdornment from "@material-ui/core/InputAdornment"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"
import TextField from "@material-ui/core/TextField"
import SendIcon from "@material-ui/icons/Send"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { HorizontalLayout } from "../Layout/Box"
import { useIsMobile, ObservedAccountData } from "../../hooks"
import { renderFormFieldError } from "../../lib/errors"
import { getMatchingAccountBalance, getAccountMinimumBalance } from "../../lib/stellar"
import { isPublicKey, isStellarAddress } from "../../lib/stellar-address"
import { PriceInput, QRReader } from "../Form/FormFields"

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

  if (!isPublicKey(formValues.destination) && !isStellarAddress(formValues.destination)) {
    errors.destination = new Error("Expected a public key or stellar address.")
  }
  if (!formValues.amount.match(/^[0-9]+(\.[0-9]+)?$/)) {
    errors.amount = new Error("Invalid amount.")
  } else if (spendableBalance.lt(formValues.amount)) {
    errors.amount = new Error("Not enough funds.")
  }

  if (formValues.memoValue.length > 28) {
    errors.memoValue = new Error("Memo too long.")
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
  onSubmit?: (formValues: PaymentCreationValues) => any
}

function PaymentCreationForm(props: Props) {
  const { onSubmit = () => undefined } = props
  const isSmallScreen = useIsMobile()

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
        placeholder="GABCDEFGHIJK... or alice*example.org"
        fullWidth
        autoFocus={process.env.PLATFORM !== "ios"}
        margin="normal"
        value={formValues.destination}
        onChange={event => setFormValue("destination", event.target.value)}
        inputProps={{
          style: { textOverflow: "ellipsis" }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment disableTypography position="end">
              <QRReader iconStyle={{ fontSize: 20 }} onScan={key => setFormValue("destination", key)} />
            </InputAdornment>
          )
        }}
      />
      <HorizontalLayout justifyContent="space-between" alignItems="center" margin="0 -24px" wrap="wrap">
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
            flexGrow: isSmallScreen ? 1 : undefined,
            marginLeft: 24,
            marginRight: 24,
            minWidth: 230,
            maxWidth: isSmallScreen ? undefined : "60%"
          }}
        />
        <TextField
          inputProps={{ maxLength: 28 }}
          error={Boolean(errors.memoValue)}
          label={errors.memoValue ? renderFormFieldError(errors.memoValue) : "Memo"}
          placeholder="Description (optional)"
          margin="normal"
          onChange={event => {
            setFormValues({
              ...formValues,
              memoValue: event.target.value,
              memoType: event.target.value.length === 0 ? "none" : "text"
            })
          }}
          value={formValues.memoValue}
          style={{
            flexGrow: 1,
            marginLeft: 24,
            marginRight: 24,
            minWidth: 230
          }}
        />
      </HorizontalLayout>
      <DialogActionsBox spacing="large" desktopStyle={{ marginTop: 64 }}>
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

export default React.memo(PaymentCreationForm)

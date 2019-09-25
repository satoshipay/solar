import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { Asset, Horizon, Memo, MemoType, Server, Transaction } from "stellar-sdk"
import FormControl from "@material-ui/core/FormControl"
import InputAdornment from "@material-ui/core/InputAdornment"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"
import TextField from "@material-ui/core/TextField"
import SendIcon from "@material-ui/icons/Send"
import { Account } from "../../context/accounts"
import { useFederationLookup } from "../../hooks/stellar"
import { ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
import { renderFormFieldError } from "../../lib/errors"
import { findMatchingBalanceLine, getAccountMinimumBalance, stringifyAsset } from "../../lib/stellar"
import { isPublicKey, isStellarAddress } from "../../lib/stellar-address"
import { createPaymentOperation, createTransaction, selectSmartMultisigTransactionFee } from "../../lib/transaction"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { PriceInput, QRReader } from "../Form/FormFields"
import { HorizontalLayout } from "../Layout/Box"
import Portal from "../Portal"

function createMemo(formValues: PaymentCreationValues) {
  switch (formValues.memoType) {
    case "id":
      return Memo.id(formValues.memoValue)
    case "text":
      return Memo.text(formValues.memoValue)
    default:
      return Memo.none()
  }
}

function getSpendableBalance(accountMinimumBalance: BigNumber, balanceLine?: Horizon.BalanceLine) {
  if (balanceLine !== undefined) {
    const fullBalance = BigNumber(balanceLine.balance)
    return balanceLine.asset_type === "native"
      ? fullBalance.minus(accountMinimumBalance).minus(balanceLine.selling_liabilities)
      : fullBalance.minus(balanceLine.selling_liabilities)
  } else {
    return BigNumber(0)
  }
}

export interface PaymentCreationValues {
  amount: string
  asset: Asset
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
  assets: Asset[]
  onSelect: (asset: Asset) => void
  selected: Asset
  style: React.CSSProperties
}

function AssetSelector(props: AssetSelectorProps) {
  const handleSelection = React.useCallback(
    (event: React.ChangeEvent<{ value: any }>) => {
      const selectedAssetKey = event.target.value
      const matchingAsset = props.assets.find(asset => stringifyAsset(asset) === selectedAssetKey)

      if (matchingAsset) {
        props.onSelect(matchingAsset)
      } else {
        throw Error(`Could not find selected asset in provided assets: ${event.target.value}`)
      }
    },
    [props.assets, props.onSelect]
  )
  return (
    <FormControl>
      <Select disableUnderline onChange={handleSelection} style={props.style} value={stringifyAsset(props.selected)}>
        {props.assets.map(asset => (
          <MenuItem key={stringifyAsset(asset)} value={stringifyAsset(asset)}>
            {asset.getCode()}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

interface Props {
  accountData: ObservedAccountData
  actionsRef: RefStateObject
  trustedAssets: Asset[]
  txCreationPending?: boolean
  onCancel: () => void
  onSubmit: (createTx: (horizon: Server, account: Account) => Promise<Transaction>) => any
}

function PaymentCreationForm(props: Props) {
  const isSmallScreen = useIsMobile()
  const { lookupFederationRecord } = useFederationLookup()

  const formID = React.useMemo(() => nanoid(), [])
  const [errors, setErrors] = React.useState<PaymentCreationErrors>({})
  const [formValues, setFormValues] = React.useState<PaymentCreationValues>({
    amount: "",
    asset: Asset.native(),
    destination: "",
    memoType: "none",
    memoValue: ""
  })

  const isDisabled = !formValues.amount || Number.isNaN(Number.parseFloat(formValues.amount)) || !formValues.destination

  // FIXME: Pass no. of open offers to getAccountMinimumBalance()
  const spendableBalance = getSpendableBalance(
    getAccountMinimumBalance(props.accountData),
    findMatchingBalanceLine(props.accountData.balances, formValues.asset)
  )

  const setFormValue = (fieldName: keyof PaymentCreationValues, value: unknown | null) => {
    const updatedFormValues = {
      ...formValues,
      [fieldName]: value
    }
    setFormValues(updatedFormValues)
  }

  const createPaymentTx = async (horizon: Server, account: Account) => {
    const asset = props.trustedAssets.find(trustedAsset => trustedAsset.equals(formValues.asset))
    const federationRecord =
      formValues.destination.indexOf("*") > -1 ? await lookupFederationRecord(formValues.destination) : null
    const destination = federationRecord ? federationRecord.account_id : formValues.destination

    const userMemo = createMemo(formValues)
    const federationMemo =
      federationRecord && federationRecord.memo && federationRecord.memo_type
        ? new Memo(federationRecord.memo_type as MemoType, federationRecord.memo)
        : Memo.none()

    if (userMemo.type !== "none" && federationMemo.type !== "none") {
      throw new Error(
        `Cannot set a custom memo. Federation record of ${formValues.destination} already specifies memo.`
      )
    }

    const isMultisigTx = props.accountData.signers.length > 1

    const payment = await createPaymentOperation({
      asset: asset || Asset.native(),
      amount: formValues.amount,
      destination,
      horizon
    })
    const tx = await createTransaction([payment], {
      accountData: props.accountData,
      memo: federationMemo.type !== "none" ? federationMemo : userMemo,
      minTransactionFee: isMultisigTx ? await selectSmartMultisigTransactionFee(horizon) : 0,
      horizon,
      walletAccount: account
    })
    return tx
  }

  const submitTransaction = () => {
    const validation = validateFormValues(formValues, spendableBalance)
    setErrors(validation.errors)

    if (validation.success) {
      props.onSubmit(createPaymentTx)
    }
  }

  const handleFormSubmission = (event: React.SyntheticEvent) => {
    event.preventDefault()
    submitTransaction()
  }

  return (
    <form id={formID} noValidate onSubmit={handleFormSubmission}>
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
              assets={props.trustedAssets}
              onSelect={code => setFormValue("asset", code)}
              selected={formValues.asset}
              style={{ alignSelf: "center" }}
            />
          }
          error={Boolean(errors.amount)}
          label={errors.amount ? renderFormFieldError(errors.amount) : "Amount"}
          margin="dense"
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
      <Portal target={props.actionsRef.element}>
        <DialogActionsBox spacing="large" desktopStyle={{ marginTop: 64 }}>
          <ActionButton
            disabled={isDisabled}
            form={formID}
            icon={<SendIcon style={{ fontSize: 16 }} />}
            loading={props.txCreationPending}
            onClick={() => undefined}
            type="submit"
          >
            Send now
          </ActionButton>
        </DialogActionsBox>
      </Portal>
    </form>
  )
}

export default React.memo(PaymentCreationForm)

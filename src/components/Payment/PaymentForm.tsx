import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, Horizon, Memo, MemoType, Server, Transaction } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import SendIcon from "@material-ui/icons/Send"
import { Account } from "../../context/accounts"
import { AccountRecord, useWellKnownAccounts } from "../../hooks/stellar-ecosystem"
import { useFederationLookup } from "../../hooks/stellar"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
import { AccountData } from "../../lib/account"
import { renderFormFieldError } from "../../lib/errors"
import { findMatchingBalanceLine, getAccountMinimumBalance } from "../../lib/stellar"
import { isPublicKey, isStellarAddress } from "../../lib/stellar-address"
import { createPaymentOperation, createTransaction, multisigMinimumFee } from "../../lib/transaction"
import { formatBalance } from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import AssetSelector from "../Form/AssetSelector"
import { PriceInput, QRReader } from "../Form/FormFields"
import { HorizontalLayout } from "../Layout/Box"
import Portal from "../Portal"

export interface PaymentFormValues {
  amount: string
  asset: Asset
  destination: string
  memoType: "id" | "none" | "text"
  memoValue: string
}

type PaymentFormErrors = { [fieldName in keyof PaymentFormValues]?: Error | null }

function createMemo(formValues: PaymentFormValues) {
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

function validateFormValues(
  formValues: PaymentFormValues,
  spendableBalance: BigNumber,
  knownAccount: AccountRecord | undefined
) {
  const errors: PaymentFormErrors = {}

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
  } else if (knownAccount && knownAccount.tags.indexOf("exchange") !== -1 && formValues.memoValue.length === 0) {
    errors.memoValue = new Error(`Set a memo when sending funds to ${knownAccount.name}`)
  } else if (formValues.memoType === "id" && !formValues.memoValue.match(/^[0-9]+$/)) {
    errors.memoValue = new Error("Memo must be an integer.")
  }

  const success = Object.keys(errors).length === 0
  return { errors, success }
}

interface PaymentFormProps {
  accountData: AccountData
  actionsRef: RefStateObject
  errors: PaymentFormErrors
  onSubmit: (formValues: PaymentFormValues, spendableBalance: BigNumber, wellknownAccount?: AccountRecord) => void
  testnet: boolean
  trustedAssets: Asset[]
  txCreationPending?: boolean
}

const PaymentForm = React.memo(function PaymentForm(props: PaymentFormProps) {
  const { errors } = props

  const isSmallScreen = useIsMobile()
  const formID = React.useMemo(() => nanoid(), [])
  const wellknownAccounts = useWellKnownAccounts(props.testnet)

  const { t } = useTranslation()

  const [formValues, setFormValues] = React.useState<PaymentFormValues>({
    amount: "",
    asset: Asset.native(),
    destination: "",
    memoType: "none",
    memoValue: ""
  })

  const [memoMetadata, setMemoMetadata] = React.useState({
    label: "Memo",
    placeholder: "Description (optional)"
  })
  const [matchingWellknownAccount, setMatchingWellknownAccount] = React.useState<AccountRecord | undefined>(undefined)

  // FIXME: Pass no. of open offers to getAccountMinimumBalance()
  const spendableBalance = getSpendableBalance(
    getAccountMinimumBalance(props.accountData),
    findMatchingBalanceLine(props.accountData.balances, formValues.asset)
  )

  React.useEffect(() => {
    if (!isPublicKey(formValues.destination) && !isStellarAddress(formValues.destination)) {
      if (matchingWellknownAccount) {
        setMatchingWellknownAccount(undefined)
      }
      return
    }

    const knownAccount = wellknownAccounts.lookup(formValues.destination)
    setMatchingWellknownAccount(knownAccount)

    if (knownAccount && knownAccount.tags.indexOf("exchange") !== -1) {
      const acceptedMemoType = knownAccount.accepts && knownAccount.accepts.memo
      setFormValue("memoType", acceptedMemoType === "MEMO_ID" ? "id" : "text")
      setMemoMetadata({
        label: `Memo ${acceptedMemoType === "MEMO_ID" ? "(ID)" : "(Text)"}`,
        placeholder: "Description (mandatory)"
      })
    } else {
      setMemoMetadata({
        label: "Memo",
        placeholder: "Description (optional)"
      })
    }
  }, [formValues.destination, formValues.memoType, wellknownAccounts])

  const isDisabled = !formValues.amount || Number.isNaN(Number.parseFloat(formValues.amount)) || !formValues.destination

  const setFormValue = (fieldName: keyof PaymentFormValues, value: unknown | null) => {
    setFormValues(prevValues => ({
      ...prevValues,
      [fieldName]: value
    }))
  }

  const handleFormSubmission = (event: React.SyntheticEvent) => {
    event.preventDefault()
    props.onSubmit(formValues, spendableBalance, matchingWellknownAccount)
  }

  const handleQRScan = React.useCallback((scanResult: string) => {
    const [destination, query] = scanResult.split("?")
    setFormValue("destination", destination)

    if (!query) {
      return
    }

    const searchParams = new URLSearchParams(query)
    const memoValue = searchParams.get("dt")

    if (memoValue) {
      setFormValue("memoType", "id")
      setFormValue("memoValue", memoValue)
    }
  }, [])

  const qrReaderAdornment = React.useMemo(
    () => (
      <InputAdornment disableTypography position="end">
        <QRReader onScan={handleQRScan} />
      </InputAdornment>
    ),
    []
  )

  const destinationInput = React.useMemo(
    () => (
      <TextField
        error={Boolean(errors.destination)}
        label={errors.destination ? renderFormFieldError(errors.destination, t) : "Destination address"}
        placeholder="GABCDEFGHIJK... or alice*example.org"
        fullWidth
        autoFocus={process.env.PLATFORM !== "ios"}
        margin="normal"
        value={formValues.destination}
        onChange={event => setFormValue("destination", event.target.value.trim())}
        inputProps={{
          style: { textOverflow: "ellipsis" }
        }}
        InputProps={{
          endAdornment: qrReaderAdornment
        }}
      />
    ),
    [errors.destination, formValues.destination]
  )

  const assetSelector = React.useMemo(
    () => (
      <AssetSelector
        assets={props.accountData.balances}
        disableUnderline
        onChange={asset => setFormValue("asset", asset)}
        style={{ alignSelf: "center" }}
        testnet={props.testnet}
        value={formValues.asset}
      />
    ),
    [formValues.asset, props.trustedAssets]
  )

  const priceInput = React.useMemo(
    () => (
      <PriceInput
        assetCode={assetSelector}
        error={Boolean(errors.amount)}
        label={errors.amount ? renderFormFieldError(errors.amount, t) : "Amount"}
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
    ),
    [assetSelector, errors.amount, formValues.amount, isSmallScreen, spendableBalance.toString(), props.trustedAssets]
  )

  const memoInput = React.useMemo(
    () => (
      <TextField
        inputProps={{ maxLength: 28 }}
        error={Boolean(errors.memoValue)}
        label={errors.memoValue ? renderFormFieldError(errors.memoValue, t) : memoMetadata.label}
        placeholder={memoMetadata.placeholder}
        margin="normal"
        onChange={event => {
          const { value } = event.target
          setFormValues(prevValues => ({
            ...prevValues,
            memoValue: value,
            memoType: value.length === 0 ? "none" : formValues.memoType === "none" ? "text" : formValues.memoType
          }))
        }}
        value={formValues.memoValue}
        style={{
          flexGrow: 1,
          marginLeft: 24,
          marginRight: 24,
          minWidth: 230
        }}
      />
    ),
    [
      errors.memoType,
      errors.memoValue,
      formValues.memoType,
      formValues.memoValue,
      memoMetadata.label,
      memoMetadata.placeholder
    ]
  )

  const dialogActions = React.useMemo(
    () => (
      <DialogActionsBox desktopStyle={{ marginTop: 64 }}>
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
    ),
    [formID, isDisabled, props.txCreationPending]
  )

  return (
    <form id={formID} noValidate onSubmit={handleFormSubmission}>
      {destinationInput}
      <HorizontalLayout justifyContent="space-between" alignItems="center" margin="0 -24px" wrap="wrap">
        {priceInput}
        {memoInput}
      </HorizontalLayout>
      <Portal target={props.actionsRef.element}>{dialogActions}</Portal>
    </form>
  )
})

interface Props {
  accountData: AccountData
  actionsRef: RefStateObject
  testnet: boolean
  trustedAssets: Asset[]
  txCreationPending?: boolean
  onCancel: () => void
  onSubmit: (createTx: (horizon: Server, account: Account) => Promise<Transaction>) => any
}

function PaymentFormContainer(props: Props) {
  const { lookupFederationRecord } = useFederationLookup()

  const [errors, setErrors] = React.useState<PaymentFormErrors>({})

  const createPaymentTx = async (horizon: Server, account: Account, formValues: PaymentFormValues) => {
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
      minTransactionFee: isMultisigTx ? multisigMinimumFee : 0,
      horizon,
      walletAccount: account
    })
    return tx
  }

  const submitForm = (formValues: PaymentFormValues, spendableBalance: BigNumber, wellknownAccount?: AccountRecord) => {
    const validation = validateFormValues(formValues, spendableBalance, wellknownAccount)
    setErrors(validation.errors)

    if (validation.success) {
      props.onSubmit((horizon, account) => createPaymentTx(horizon, account, formValues))
    }
  }

  return <PaymentForm {...props} errors={errors} onSubmit={submitForm} />
}

export default React.memo(PaymentFormContainer)

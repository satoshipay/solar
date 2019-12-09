import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { Asset, Horizon, Memo, MemoType, Server, Transaction } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import SendIcon from "@material-ui/icons/Send"
import { useFormik, FormikErrors } from "formik"
import { Account } from "../../context/accounts"
import { AccountRecord, useWellKnownAccounts } from "../../hooks/stellar-ecosystem"
import { useFederationLookup } from "../../hooks/stellar"
import { ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
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

interface PaymentFormProps {
  accountData: ObservedAccountData
  actionsRef: RefStateObject
  testnet: boolean
  trustedAssets: Asset[]
  txCreationPending?: boolean
  onSubmit: (createTx: (horizon: Server, account: Account) => Promise<Transaction>) => any
}

const PaymentForm = React.memo(function PaymentForm(props: PaymentFormProps) {
  const isSmallScreen = useIsMobile()
  const formID = React.useMemo(() => nanoid(), [])
  const wellknownAccounts = useWellKnownAccounts(props.testnet)
  const { lookupFederationRecord } = useFederationLookup()
  const [matchingWellknownAccount, setMatchingWellknownAccount] = React.useState<AccountRecord | undefined>(undefined)
  const [memoMetadata, setMemoMetadata] = React.useState({
    label: "Memo",
    placeholder: "Description (optional)"
  })

  const formik = useFormik<PaymentFormValues>({
    initialValues: { amount: "", asset: Asset.native(), destination: "", memoType: "none", memoValue: "" },
    validate(values) {
      const errors: FormikErrors<PaymentFormValues> = {}
      if (!isPublicKey(values.destination) && !isStellarAddress(values.destination)) {
        errors.destination = "Expected a public key or stellar address."
      }
      if (!values.amount.match(/^[0-9]+(\.[0-9]+)?$/)) {
        errors.amount = "Invalid amount."
      } else if (spendableBalance.lt(values.amount)) {
        errors.amount = "Not enough funds."
      }

      if (values.memoValue.length > 28) {
        errors.memoValue = "Memo too long."
      } else if (
        matchingWellknownAccount &&
        matchingWellknownAccount.tags.indexOf("exchange") !== -1 &&
        values.memoValue.length === 0
      ) {
        errors.memoValue = `Set a memo when sending funds to ${matchingWellknownAccount.name}`
      } else if (values.memoType === "id" && !values.memoValue.match(/^[0-9]+$/)) {
        errors.memoValue = "Memo must be an integer."
      }

      return errors
    },
    onSubmit(values) {
      props.onSubmit((horizon, account) => createPaymentTx(horizon, account, values))
    }
  })

  const createPaymentTx = React.useCallback(
    async (horizon: Server, account: Account, formValues: PaymentFormValues) => {
      const trustedAsset = props.trustedAssets.find(a => a.equals(formValues.asset))
      const federationRecord =
        formValues.destination.indexOf("*") > -1 ? await lookupFederationRecord(formValues.destination) : null
      const dest = federationRecord ? federationRecord.account_id : formValues.destination

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
        asset: trustedAsset || Asset.native(),
        amount: formValues.amount,
        destination: dest,
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
    },
    [props.accountData, props.trustedAssets]
  )

  const { amount, asset, destination, memoType, memoValue } = formik.values

  // FIXME: Pass no. of open offers to getAccountMinimumBalance()
  const spendableBalance = getSpendableBalance(
    getAccountMinimumBalance(props.accountData),
    findMatchingBalanceLine(props.accountData.balances, asset)
  )

  React.useEffect(() => {
    if (!isPublicKey(destination) && !isStellarAddress(destination)) {
      if (matchingWellknownAccount) {
        setMatchingWellknownAccount(undefined)
      }
      return
    }

    const knownAccount = wellknownAccounts.lookup(destination)
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
  }, [destination, memoType])

  const setFormValue = React.useCallback((fieldName: keyof PaymentFormValues, value: unknown | null) => {
    formik.setFieldValue(fieldName, value)
  }, [])

  const handleQRScan = React.useCallback(key => setFormValue("destination", key), [setFormValue])

  const qrReaderAdornment = React.useMemo(
    () => (
      <InputAdornment disableTypography position="end">
        <QRReader onScan={handleQRScan} />
      </InputAdornment>
    ),
    [handleQRScan]
  )

  const destinationInput = React.useMemo(
    () => (
      <TextField
        error={Boolean(formik.errors.destination && formik.touched.destination)}
        label={
          formik.errors.destination && formik.touched.destination
            ? renderFormFieldError(formik.errors.destination)
            : "Destination address"
        }
        placeholder="GABCDEFGHIJK... or alice*example.org"
        fullWidth
        autoFocus={process.env.PLATFORM !== "ios"}
        margin="normal"
        name="destination"
        value={destination}
        onBlur={formik.handleBlur}
        onChange={formik.handleChange}
        inputProps={{
          style: { textOverflow: "ellipsis" }
        }}
        InputProps={{
          endAdornment: qrReaderAdornment
        }}
      />
    ),
    [destination, formik.errors.destination, formik.touched.destination]
  )

  const handleAssetChange = React.useCallback(value => setFormValue("asset", value), [setFormValue])

  const assetSelector = React.useMemo(
    () => (
      <AssetSelector
        disableUnderline
        onChange={handleAssetChange}
        style={{ alignSelf: "center" }}
        trustlines={props.accountData.balances}
        value={asset}
      />
    ),
    [asset, handleAssetChange, props.trustedAssets]
  )

  const handlePriceInput = React.useCallback(event => setFormValue("amount", event.target.value), [setFormValue])

  const priceInput = React.useMemo(
    () => (
      <PriceInput
        assetCode={assetSelector}
        error={Boolean(formik.errors.amount && formik.touched.amount)}
        label={formik.errors.amount && formik.touched.amount ? renderFormFieldError(formik.errors.amount) : "Amount"}
        margin="normal"
        name="amount"
        onBlur={formik.handleBlur}
        onChange={handlePriceInput}
        placeholder={`Max. ${formatBalance(spendableBalance.toString())}`}
        value={amount}
        style={{
          flexGrow: isSmallScreen ? 1 : undefined,
          marginLeft: 24,
          marginRight: 24,
          minWidth: 230,
          maxWidth: isSmallScreen ? undefined : "60%"
        }}
      />
    ),
    [
      amount,
      assetSelector,
      handlePriceInput,
      formik.errors.amount,
      formik.touched.amount,
      isSmallScreen,
      spendableBalance.toString(),
      props.trustedAssets
    ]
  )

  const handleMemoChange = React.useCallback(
    event => {
      const { value } = event.target
      setFormValue("memoValue", value)
      setFormValue("memoType", value.length === 0 ? "none" : memoType === "none" ? "text" : memoType)
    },
    [memoType, setFormValue]
  )

  const memoInput = React.useMemo(
    () => (
      <TextField
        inputProps={{ maxLength: 28 }}
        error={Boolean(formik.errors.memoValue && formik.touched.memoValue)}
        label={
          formik.errors.memoValue && formik.touched.memoValue
            ? renderFormFieldError(formik.errors.memoValue)
            : memoMetadata.label
        }
        placeholder={memoMetadata.placeholder}
        margin="normal"
        name="memoValue"
        onBlur={formik.handleBlur}
        onChange={handleMemoChange}
        value={memoValue}
        style={{
          flexGrow: 1,
          marginLeft: 24,
          marginRight: 24,
          minWidth: 230
        }}
      />
    ),
    [handleMemoChange, formik.errors.memoValue, memoType, memoValue, memoMetadata.label, memoMetadata.placeholder]
  )

  const dialogActions = React.useMemo(
    () => (
      <DialogActionsBox desktopStyle={{ marginTop: 64 }}>
        <ActionButton
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
    [formID, props.txCreationPending]
  )

  return (
    <form id={formID} noValidate onSubmit={formik.handleSubmit}>
      {destinationInput}
      <HorizontalLayout justifyContent="space-between" alignItems="center" margin="0 -24px" wrap="wrap">
        {priceInput}
        {memoInput}
      </HorizontalLayout>
      <Portal target={props.actionsRef.element}>{dialogActions}</Portal>
    </form>
  )
})

export default React.memo(PaymentForm)

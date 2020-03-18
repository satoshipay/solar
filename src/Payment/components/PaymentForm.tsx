import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { Asset, Horizon, Memo, MemoType, Server, Transaction } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import SendIcon from "@material-ui/icons/Send"
import { Account } from "~App/contexts/accounts"
import { AccountRecord, useWellKnownAccounts } from "~Generic/hooks/stellar-ecosystem"
import { useFederationLookup } from "~Generic/hooks/stellar"
import { useIsMobile, RefStateObject } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { findMatchingBalanceLine, getAccountMinimumBalance } from "~Generic/lib/stellar"
import { isPublicKey, isStellarAddress } from "~Generic/lib/stellar-address"
import { createPaymentOperation, createTransaction, multisigMinimumFee } from "~Generic/lib/transaction"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import AssetSelector from "~Generic/components/AssetSelector"
import { PriceInput, QRReader } from "~Generic/components/FormFields"
import { formatBalance } from "~Generic/lib/balances"
import { HorizontalLayout } from "~Layout/components/Box"
import Portal from "~Generic/components/Portal"

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
  accountData: AccountData
  actionsRef: RefStateObject
  onSubmit: (formValues: PaymentFormValues, spendableBalance: BigNumber, wellknownAccount?: AccountRecord) => void
  testnet: boolean
  trustedAssets: Asset[]
  txCreationPending?: boolean
}

const PaymentForm = React.memo(function PaymentForm(props: PaymentFormProps) {
  const isSmallScreen = useIsMobile()
  const formID = React.useMemo(() => nanoid(), [])
  const wellknownAccounts = useWellKnownAccounts(props.testnet)

  const [matchingWellknownAccount, setMatchingWellknownAccount] = React.useState<AccountRecord | undefined>(undefined)
  const [memoMetadata, setMemoMetadata] = React.useState({
    label: "Memo",
    placeholder: "Description (optional)"
  })
  const { control, errors, getValues, handleSubmit, register, setValue, watch } = useForm<PaymentFormValues>({
    defaultValues: {
      amount: "",
      asset: Asset.native(),
      destination: "",
      memoType: "none",
      memoValue: ""
    }
  })

  const formValues = watch()

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
      setValue("memoType", acceptedMemoType === "MEMO_ID" ? "id" : "text")
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
  }, [formValues.destination, formValues.memoType, matchingWellknownAccount, setValue, wellknownAccounts])

  const handleFormSubmission = () => {
    props.onSubmit(getValues(), spendableBalance, matchingWellknownAccount)
  }

  const handleQRScan = React.useCallback(
    (scanResult: string) => {
      const [destination, query] = scanResult.split("?")
      setValue("destination", destination)

      if (!query) {
        return
      }

      const searchParams = new URLSearchParams(query)
      const memoValue = searchParams.get("dt")

      if (memoValue) {
        setValue("memoType", "id")
        setValue("memoValue", memoValue)
      }
    },
    [setValue]
  )

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
        autoFocus={process.env.PLATFORM !== "ios"}
        error={Boolean(errors.destination)}
        fullWidth
        inputProps={{
          style: { textOverflow: "ellipsis" }
        }}
        InputProps={{
          endAdornment: qrReaderAdornment
        }}
        inputRef={register({
          required: "No destination specified!",
          validate: value =>
            isPublicKey(value) || isStellarAddress(value) || "Expected a public key or stellar address."
        })}
        label={errors.destination ? errors.destination.message : "Destination address"}
        margin="normal"
        name="destination"
        onChange={event => setValue("destination", event.target.value.trim())}
        placeholder="GABCDEFGHIJK... or alice*example.org"
      />
    ),
    [errors.destination, qrReaderAdornment, register, setValue]
  )

  const assetSelector = React.useMemo(
    () => (
      <Controller
        as={
          <AssetSelector
            assets={props.accountData.balances}
            disableUnderline
            style={{ alignSelf: "center" }}
            testnet={props.testnet}
            value={formValues.asset}
          />
        }
        control={control}
        name="asset"
      />
    ),
    [control, formValues.asset, props.accountData.balances, props.testnet]
  )

  const priceInput = React.useMemo(
    () => (
      <PriceInput
        assetCode={assetSelector}
        error={Boolean(errors.amount)}
        inputRef={register({
          required: "No amount specified!",
          pattern: { value: /^[0-9]+(\.[0-9]+)?$/, message: "Invalid amount." },
          validate: value => BigNumber(value).lt(spendableBalance) || "Not enough funds."
        })}
        label={errors.amount ? errors.amount.message : "Amount"}
        margin="normal"
        name="amount"
        placeholder={`Max. ${formatBalance(spendableBalance.toString())}`}
        style={{
          flexGrow: isSmallScreen ? 1 : undefined,
          marginLeft: 24,
          marginRight: 24,
          minWidth: 230,
          maxWidth: isSmallScreen ? undefined : "60%"
        }}
      />
    ),
    [assetSelector, errors.amount, isSmallScreen, spendableBalance, register]
  )

  const memoInput = React.useMemo(
    () => (
      <TextField
        error={Boolean(errors.memoValue)}
        inputProps={{ maxLength: 28 }}
        label={errors.memoValue ? errors.memoValue.message : memoMetadata.label}
        margin="normal"
        name="memoValue"
        inputRef={register({
          validate: {
            length: value => value.length <= 28 || "Memo too long.",
            memoRequired: value =>
              !matchingWellknownAccount ||
              matchingWellknownAccount.tags.indexOf("exchange") === -1 ||
              value.length > 0 ||
              `Set a memo when sending funds to ${matchingWellknownAccount.name}`,
            idPattern: value => formValues.memoType !== "id" || value.match(/^[0-9]+$/) || "Memo must be an integer"
          }
        })}
        onChange={event => {
          const { value } = event.target
          const memoType = value.length === 0 ? "none" : formValues.memoType === "none" ? "text" : formValues.memoType
          setValue("memoValue", value)
          setValue("memoType", memoType)
        }}
        placeholder={memoMetadata.placeholder}
        style={{
          flexGrow: 1,
          marginLeft: 24,
          marginRight: 24,
          minWidth: 230
        }}
      />
    ),
    [
      errors.memoValue,
      formValues.memoType,
      matchingWellknownAccount,
      memoMetadata.label,
      memoMetadata.placeholder,
      register,
      setValue
    ]
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
    <form id={formID} noValidate onSubmit={handleSubmit(handleFormSubmission)}>
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

  const submitForm = (formValues: PaymentFormValues) => {
    props.onSubmit((horizon, account) => createPaymentTx(horizon, account, formValues))
  }

  return <PaymentForm {...props} onSubmit={submitForm} />
}

export default React.memo(PaymentFormContainer)

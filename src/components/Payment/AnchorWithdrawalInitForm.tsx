import React from "react"
import { Asset } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { AssetTransferInfo, EmptyAssetTransferInfo, TransferServer } from "@satoshipay/sep-6"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { formatFieldDescription, formatIdentifier } from "./formatters"
import { useAssetTransferServerInfos } from "./hooks"
import FormBuilder from "./FormBuilder"

type FormValueTransform<Value = string> = (input: Value) => Value

function maybeIBAN(value: string) {
  if (value && value.length >= 15 && value.match(/^[A-Z]{2}[0-9]{2}\s?[A-Z0-9]{4}\s?[A-Z0-9]{4}/)) {
    return value.replace(/\s+/g, "")
  }
  return value
}

function filterObject<V>(obj: { [key: string]: V }, filter: (value: V, key: string) => boolean) {
  return Object.keys(obj).reduce<{ [key: string]: V }>((filtered, key) => {
    const value = obj[key]
    return filter(value, key) ? { ...filtered, [key]: value } : filtered
  }, {})
}

interface FormValues {
  [fieldName: string]: string
}

interface Props {
  assets: Asset[]
  onCancel: () => void
  onSubmit: (transferServer: TransferServer, asset: Asset, method: string, formValues: FormValues) => void
  testnet: boolean
  withdrawalResponsePending?: boolean
}

function AnchorWithdrawalInitForm(props: Props) {
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)
  const withdrawableAssetCodes = Object.keys(transferInfos.data).filter(someAssetCode => {
    const deposit = transferInfos.data[someAssetCode].transferInfo.deposit
    return deposit && deposit.enabled
  })

  const [assetCode, setAssetCode] = React.useState<string | null>(withdrawableAssetCodes[0] || null)
  const [methodID, setMethodID] = React.useState<string | null>(null)

  const [formValues, setFormValues] = React.useState<FormValues>({})
  const setFormValue = (fieldName: string, newValue: string) =>
    setFormValues(prevFormValues => ({ ...prevFormValues, [fieldName]: newValue }))

  const withdrawalMetadata: AssetTransferInfo | EmptyAssetTransferInfo | undefined = transferInfos.data[assetCode || ""]
    ? transferInfos.data[assetCode || ""].transferInfo
    : undefined

  const methodNames =
    withdrawalMetadata && withdrawalMetadata.withdraw && withdrawalMetadata.withdraw.types
      ? Object.keys(withdrawalMetadata.withdraw.types)
      : []
  const methodMetadata =
    methodID && withdrawalMetadata && withdrawalMetadata.withdraw && withdrawalMetadata.withdraw.types
      ? withdrawalMetadata.withdraw.types[methodID]
      : null

  const fields = methodMetadata && methodMetadata.fields ? methodMetadata.fields : {}
  const getFieldDescription = (name: string, keepShort: boolean = false) => {
    const description = (fields[name] && fields[name].description) || undefined
    return description ? formatFieldDescription(description, fields[name].optional || false, keepShort) : undefined
  }

  const postprocessFormValue = (fieldName: string, transforms: FormValueTransform[]) => {
    const originalValue = formValues[fieldName]
    let fieldValue = originalValue

    for (const transform of transforms) {
      fieldValue = transform(fieldValue)
    }

    if (fieldValue !== originalValue) {
      setFormValue(fieldName, fieldValue)
    }
    return fieldValue
  }

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()

    const asset = props.assets.find(someAsset => someAsset.getCode() === assetCode)
    if (!asset) {
      throw new Error("No asset selected.")
    }

    const transferServer = transferInfos.data[asset.getCode()].transferServer
    if (!transferServer) {
      throw new Error(`No transfer server found for asset ${asset.getCode()}`)
    }
    if (!methodID) {
      throw new Error("No withdrawal method selected.")
    }
    if (methodID === "bank_account") {
      formValues.dest = postprocessFormValue("dest", [maybeIBAN])
    }
    props.onSubmit(transferServer, asset, methodID, formValues)
  }

  const automaticallySetValues = ["account", "asset_code", "type"]

  // The .filter() is necessary due to a misplaced prop in the response of an anchor
  const hasEmptyMandatoryFields = Object.keys(fields)
    .filter(key => fields[key] && typeof fields[key] === "object")
    .some(key => !fields[key].optional && !formValues[key] && automaticallySetValues.indexOf(key) === -1)

  const invalidAmount = fields.amount && !/^[0-9]+(\.[0-9]+)?$/.test(formValues.amount)
  const invalidEmail =
    (fields.email || fields.email_address) && !/^[^@]+@[^@]+\.[^@]+$/.test(formValues.email || formValues.email_address)
  const isDisabled = !assetCode || !methodID || hasEmptyMandatoryFields || invalidAmount || invalidEmail

  return (
    <form onSubmit={handleSubmit}>
      <VerticalLayout>
        <HorizontalLayout>
          <TextField
            label="Asset to withdraw"
            onChange={event => setAssetCode(event.target.value || null)}
            select
            style={{ flexGrow: 1, marginRight: 24, maxWidth: 180 }}
            value={assetCode || ""}
          >
            {Object.keys(transferInfos.data).map(thisAssetCode => {
              const deposit = transferInfos.data[thisAssetCode].transferInfo.deposit
              return deposit && deposit.enabled ? (
                <MenuItem key={thisAssetCode} value={thisAssetCode}>
                  {thisAssetCode}
                </MenuItem>
              ) : null
            })}
            {withdrawableAssetCodes.length === 0 ? (
              <MenuItem disabled value="">
                No withdrawable assets
              </MenuItem>
            ) : null}
          </TextField>
          <TextField
            label="Type of withdrawal"
            onChange={event => setMethodID(event.target.value || null)}
            select
            style={{ flexGrow: 1 }}
            value={methodID || ""}
          >
            <MenuItem disabled value="">
              {assetCode ? "Please select a type" : "Select an asset first"}
            </MenuItem>
            {methodNames.map(methodName => (
              <MenuItem key={methodName} value={methodName}>
                {formatIdentifier(methodName)}
              </MenuItem>
            ))}
          </TextField>
        </HorizontalLayout>
        <HorizontalLayout>
          {fields.dest ? (
            <TextField
              label="Destination account"
              onChange={event => setFormValue("dest", event.target.value)}
              placeholder={getFieldDescription("dest")}
              style={{ flexGrow: 3, marginTop: 24, marginRight: fields.dest_extra ? 24 : undefined }}
              value={formValues.dest || ""}
            />
          ) : null}
          {fields.dest_extra ? (
            <TextField
              label={getFieldDescription("dest_extra", true) || "Extra destination data (no description)"}
              onChange={event => setFormValue("dest_extra", event.target.value)}
              placeholder={getFieldDescription("dest_extra")}
              style={{ flexGrow: 1, marginTop: 24 }}
              value={formValues.dest_extra || ""}
            />
          ) : null}
        </HorizontalLayout>
        <FormBuilder
          fields={filterObject(
            fields,
            (value, key) => [...automaticallySetValues, "dest", "dest_extra"].indexOf(key) === -1
          )}
          fieldStyle={{ marginTop: 24 }}
          formValues={formValues}
          onSetFormValue={setFormValue}
        />
        <DialogActionsBox spacing="large" style={{ marginTop: 64 }}>
          <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
          <ActionButton
            disabled={isDisabled}
            loading={props.withdrawalResponsePending}
            onClick={() => undefined}
            type="submit"
          >
            Proceed
          </ActionButton>
        </DialogActionsBox>
      </VerticalLayout>
    </form>
  )
}

export default AnchorWithdrawalInitForm

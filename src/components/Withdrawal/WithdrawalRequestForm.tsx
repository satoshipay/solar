import nanoid from "nanoid"
import React from "react"
import { Asset } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { AssetTransferInfo, EmptyAssetTransferInfo, TransferServer } from "@satoshipay/stellar-sep-6"
import { useIsMobile, useIsSmallMobile } from "../../hooks"
import theme from "../../theme"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { formatDescriptionText, formatIdentifier } from "./formatters"
import { useAssetTransferServerInfos } from "./transferservice"
import FormBuilder, { FormBuilderField } from "./FormBuilder"
import Portal from "../Portal"

type FormValueTransform<Value = string> = (input: Value) => Value

const isFormValueSet = (value: string | undefined): boolean => typeof value === "string" && value.length > 0

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
  dialogActions?: HTMLElement
  initialAsset?: Asset
  initialFormValues?: FormValues
  initialMethod?: string
  onCancel: () => void
  onSubmit: (transferServer: TransferServer, asset: Asset, method: string, formValues: FormValues) => void
  testnet: boolean
  pendingAnchorCommunication?: boolean
}

function AnchorWithdrawalInitForm(props: Props) {
  const formID = React.useMemo(() => nanoid(), [])
  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)

  const withdrawableAssetCodes = Object.keys(transferInfos.data).filter(someAssetCode => {
    const deposit = transferInfos.data[someAssetCode].transferInfo.deposit
    return deposit && deposit.enabled
  })

  const initialAssetCode = props.initialAsset ? props.initialAsset.getCode() : withdrawableAssetCodes[0]
  const [assetCode, setAssetCode] = React.useState<string | null>(initialAssetCode || null)
  const [methodID, setMethodID] = React.useState<string | null>(props.initialMethod || null)

  const [formValues, setFormValues] = React.useState<FormValues>(props.initialFormValues || {})
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
  const emailField = fields.email || fields.email_address

  // The .filter() is necessary due to a misplaced prop in the response of an anchor
  const hasEmptyMandatoryFields = Object.keys(fields)
    .filter(key => fields[key] && typeof fields[key] === "object")
    .some(key => !fields[key].optional && !formValues[key] && automaticallySetValues.indexOf(key) === -1)

  const amountOptional = fields.amount ? fields.amount.optional : true
  const emailOptional = emailField ? emailField.optional : true

  const validAmount =
    (amountOptional || isFormValueSet(formValues.amount)) && /^([0-9]+(\.[0-9]+)?)?$/.test(formValues.amount || "")

  const validEmail =
    (emailOptional || isFormValueSet(formValues.email) || isFormValueSet(formValues.email_address)) &&
    /^([^@]+@[^@]+\.[^@]+)?$/.test(formValues.email || formValues.email_address || "")

  const isDisabled = !assetCode || !methodID || hasEmptyMandatoryFields || !validAmount || !validEmail
  const leftInputsWidth = isSmallScreen ? 200 : 240

  const onAssetSelection = React.useCallback(event => {
    const selectedAssetCode = event.target.value || null
    const withdraw = selectedAssetCode && transferInfos.data[selectedAssetCode].transferInfo.withdraw

    setAssetCode(selectedAssetCode)
    if (withdraw && withdraw.types && Object.keys(withdraw.types).length === 1) {
      setMethodID(Object.keys(withdraw.types)[0])
    }
  }, [])

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <VerticalLayout>
        <HorizontalLayout justifyContent="space-between" margin="0 0 -8px">
          <TextField
            label={isTinyScreen ? "Asset" : "Asset to withdraw"}
            margin="normal"
            onChange={onAssetSelection}
            select
            style={{ flexBasis: leftInputsWidth, marginRight: 24 }}
            value={assetCode || ""}
          >
            {Object.keys(transferInfos.data).map(thisAssetCode => {
              const deposit = transferInfos.data[thisAssetCode].transferInfo.deposit
              return deposit ? (
                <MenuItem key={thisAssetCode} disabled={!deposit.enabled} value={thisAssetCode}>
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
            margin="normal"
            onChange={event => setMethodID(event.target.value || null)}
            select
            style={{ flexGrow: 2.5 }}
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
        <HorizontalLayout margin="0 -12px" wrap="wrap">
          {fields.dest ? (
            <FormBuilderField
              name="Destination account"
              descriptor={fields.dest}
              onChange={event => setFormValue("dest", event.target.value)}
              style={{ flexGrow: 3, margin: "24px 12px 0" }}
              value={formValues.dest || ""}
            />
          ) : null}
          {fields.dest_extra ? (
            <FormBuilderField
              name={
                fields.dest_extra.description
                  ? formatDescriptionText(fields.dest_extra.description)
                  : "Extra destination data (no description)"
              }
              descriptor={fields.dest_extra}
              onChange={event => setFormValue("dest_extra", event.target.value)}
              style={{ flexGrow: 1, margin: "24px 12px 0", minWidth: 150 }}
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
          style={{ marginBottom: 24 }}
        />
        <HorizontalLayout alignItems="center" justifyContent="space-between" wrap="wrap">
          {withdrawalMetadata && withdrawalMetadata.withdraw ? (
            <ReadOnlyTextfield
              inputProps={{
                style: {
                  color: theme.palette.text.secondary
                }
              }}
              label="Withdrawal fee"
              style={{
                flexBasis: leftInputsWidth,
                marginRight: 24
              }}
              value={
                [
                  typeof withdrawalMetadata.withdraw.fee_fixed === "number"
                    ? `${withdrawalMetadata.withdraw.fee_fixed} ${assetCode}`
                    : "",
                  typeof withdrawalMetadata.withdraw.fee_percent === "number"
                    ? `${withdrawalMetadata.withdraw.fee_percent}%`
                    : ""
                ].join(" + ") || "unknown"
              }
            />
          ) : null}
        </HorizontalLayout>
        <Portal target={props.dialogActions}>
          <DialogActionsBox desktopStyle={{ marginTop: 0 }} spacing="large">
            <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
            <ActionButton
              disabled={isDisabled}
              form={formID}
              loading={props.pendingAnchorCommunication}
              onClick={() => undefined}
              type="submit"
            >
              Proceed
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </VerticalLayout>
    </form>
  )
}

export default React.memo(AnchorWithdrawalInitForm)

import nanoid from "nanoid"
import React from "react"
import { Asset } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { AssetTransferInfo, EmptyAssetTransferInfo, TransferServer } from "@satoshipay/stellar-sep-6"
import { useIsMobile, useIsSmallMobile, RefStateObject } from "../../hooks/userinterface"
import theme from "../../theme"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import AssetSelector from "../Form/AssetSelector"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import Portal from "../Portal"
import { formatDescriptionText, formatIdentifier } from "./formatters"
import { useAssetTransferServerInfos } from "./transferservice"
import FormBuilder, { FormBuilderField } from "./FormBuilder"

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
  actionsRef: RefStateObject
  assets: Asset[]
  initialAsset?: Asset
  initialFormValues?: FormValues
  initialMethod?: string
  onCancel: () => void
  onSubmit: (transferServer: TransferServer, asset: Asset, method: string, formValues: FormValues) => void
  pendingAnchorCommunication?: boolean
  testnet: boolean
  withdrawableAssets: Asset[]
}

function WithdrawalRequestForm(props: Props) {
  const formID = React.useMemo(() => nanoid(), [])
  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)

  const withdrawableAssets = props.withdrawableAssets

  const nonwithdrawableAssets = props.assets.filter(
    asset => !props.withdrawableAssets.some(withdrawable => withdrawable.equals(asset))
  )

  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(
    props.initialAsset || withdrawableAssets[0] || null
  )

  const [formValues, setFormValues] = React.useState<FormValues>(props.initialFormValues || {})
  const setFormValue = (fieldName: string, newValue: string) =>
    setFormValues(prevFormValues => ({ ...prevFormValues, [fieldName]: newValue }))

  const withdrawalMetadata: AssetTransferInfo | EmptyAssetTransferInfo | undefined =
    selectedAsset && transferInfos.data.has(selectedAsset)
      ? transferInfos.data.get(selectedAsset)!.transferInfo
      : undefined

  const methodNames =
    withdrawalMetadata && withdrawalMetadata.withdraw && withdrawalMetadata.withdraw.types
      ? Object.keys(withdrawalMetadata.withdraw.types)
      : []

  const [methodID, setMethodID] = React.useState<string | null>(
    props.initialMethod || methodNames.length === 1 ? methodNames[0] : null
  )

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

    if (!selectedAsset) {
      throw new Error("No asset selected.")
    }

    const transferServer = transferInfos.data.get(selectedAsset)!.transferServer
    if (!transferServer) {
      throw new Error(`No transfer server found for asset ${selectedAsset.getCode()}`)
    }
    if (!methodID) {
      throw new Error("No withdrawal method selected.")
    }
    if (methodID === "bank_account") {
      formValues.dest = postprocessFormValue("dest", [maybeIBAN])
    }
    props.onSubmit(transferServer, selectedAsset, methodID, formValues)
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

  const isDisabled = !selectedAsset || !methodID || hasEmptyMandatoryFields || !validAmount || !validEmail
  const leftInputsWidth = isSmallScreen ? 200 : 240

  const onAssetSelection = React.useCallback((asset: Asset) => {
    const withdraw = transferInfos.data.has(asset) && transferInfos.data.get(asset)!.transferInfo.withdraw

    setSelectedAsset(asset)
    if (withdraw && withdraw.types && Object.keys(withdraw.types).length === 1) {
      setMethodID(Object.keys(withdraw.types)[0])
    }
  }, [])

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <VerticalLayout>
        <HorizontalLayout justifyContent="space-between" margin="0 0 -8px">
          <AssetSelector
            assets={props.assets}
            disabledAssets={nonwithdrawableAssets}
            label={isTinyScreen ? "Asset" : "Asset to withdraw"}
            margin="normal"
            onChange={onAssetSelection}
            selected={selectedAsset || undefined}
            style={{ flexBasis: leftInputsWidth, marginRight: 24 }}
          >
            {withdrawableAssets.length === 0 ? (
              <MenuItem disabled value="">
                No withdrawable assets
              </MenuItem>
            ) : null}
          </AssetSelector>
          <TextField
            label="Type of withdrawal"
            margin="normal"
            onChange={event => setMethodID(event.target.value || null)}
            select
            style={{ flexGrow: 2.5 }}
            value={methodID || ""}
          >
            <MenuItem disabled value="">
              {selectedAsset ? "Please select a type" : "Select an asset first"}
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
                    ? `${withdrawalMetadata.withdraw.fee_fixed} ${selectedAsset && selectedAsset.getCode()}`
                    : "",
                  typeof withdrawalMetadata.withdraw.fee_percent === "number"
                    ? `${withdrawalMetadata.withdraw.fee_percent}%`
                    : ""
                ].join(" + ") || "unknown"
              }
            />
          ) : null}
        </HorizontalLayout>
        <Portal target={props.actionsRef.element}>
          <DialogActionsBox desktopStyle={{ marginTop: 0 }}>
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

export default React.memo(WithdrawalRequestForm)

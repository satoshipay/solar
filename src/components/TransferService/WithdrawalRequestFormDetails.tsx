import nanoid from "nanoid"
import React from "react"
import { Asset } from "stellar-sdk"
import { AssetTransferInfo, EmptyAssetTransferInfo } from "@satoshipay/stellar-sep-6"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
import theme from "../../theme"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import Portal from "../Portal"
import { formatDescriptionText } from "./formatters"
import { fieldStyle, FormBuilder, FormBuilderField, FormBuilderFieldSet } from "./FormBuilder"

interface FormValues {
  [fieldName: string]: string
}

type FormValueTransform<Value = string> = (input: Value) => Value

const isFormValueSet = (value: string | undefined): boolean => typeof value === "string" && value.length > 0

function filterObject<V>(obj: { [key: string]: V }, filter: (value: V, key: string) => boolean) {
  return Object.keys(obj).reduce<{ [key: string]: V }>((filtered, key) => {
    const value = obj[key]
    return filter(value, key) ? { ...filtered, [key]: value } : filtered
  }, {})
}

function maybeIBAN(value: string) {
  if (value && value.length >= 15 && value.match(/^[A-Z]{2}[0-9]{2}\s?[A-Z0-9]{4}\s?[A-Z0-9]{4}/)) {
    return value.replace(/\s+/g, "")
  }
  return value
}

function postprocessFormValue(originalValue: string, transforms: FormValueTransform[]) {
  return transforms.reduce((transformed, transform) => transform(transformed), originalValue)
}

function postprocessFormValues(inputFormValues: FormValues, methodID: string): FormValues {
  const formValues = { ...inputFormValues }

  if (methodID === "bank_account") {
    formValues.dest = postprocessFormValue(formValues.dest, [maybeIBAN])
  }
  return formValues
}

interface WithdrawalRequestFormDetailsProps {
  actionsRef: RefStateObject
  asset: Asset
  initialFormValues?: FormValues
  methodID: string
  onSubmit: (formValues: FormValues) => void
  pendingAnchorCommunication?: boolean
  withdrawalMetadata: AssetTransferInfo | EmptyAssetTransferInfo
}

function WithdrawalRequestFormDetails(props: WithdrawalRequestFormDetailsProps) {
  const formID = React.useMemo(() => nanoid(), [])
  const isSmallScreen = useIsMobile()

  const [formValues, setFormValues] = React.useState<FormValues>(props.initialFormValues || {})
  const setFormValue = (fieldName: string, newValue: string) =>
    setFormValues(prevFormValues => ({ ...prevFormValues, [fieldName]: newValue }))

  const handleSubmit = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault()
      const postprocessedValues = postprocessFormValues(formValues, props.methodID)
      setFormValues(postprocessedValues)
      props.onSubmit(postprocessedValues)
    },
    [formValues, props.methodID]
  )

  const methodMetadata =
    props.methodID && props.withdrawalMetadata.withdraw && props.withdrawalMetadata.withdraw.types
      ? props.withdrawalMetadata.withdraw.types[props.methodID]
      : null

  const fields = methodMetadata && methodMetadata.fields ? methodMetadata.fields : {}

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

  const isDisabled = !props.asset || !props.methodID || hasEmptyMandatoryFields || !validAmount || !validEmail
  const leftInputsWidth = isSmallScreen ? 200 : 240

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <VerticalLayout>
        <FormBuilderFieldSet>
          {fields.dest ? (
            <FormBuilderField
              name="Destination account"
              descriptor={fields.dest}
              onChange={event => setFormValue("dest", event.target.value)}
              style={{ ...fieldStyle, marginTop: 24 }}
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
              style={{ ...fieldStyle, marginTop: 24 }}
              value={formValues.dest_extra || ""}
            />
          ) : null}
        </FormBuilderFieldSet>
        <FormBuilder
          fields={filterObject(
            fields,
            (value, key) => [...automaticallySetValues, "dest", "dest_extra"].indexOf(key) === -1
          )}
          fieldStyle={{ marginTop: 24 }}
          formValues={formValues}
          onSetFormValue={setFormValue}
        />
        <HorizontalLayout alignItems="center" justifyContent="space-between" wrap="wrap">
          {props.withdrawalMetadata.withdraw ? (
            <ReadOnlyTextfield
              inputProps={{
                style: {
                  color: theme.palette.text.secondary
                }
              }}
              label="Withdrawal fee"
              style={{
                flexBasis: leftInputsWidth,
                marginRight: 24,
                marginTop: 24
              }}
              value={
                [
                  typeof props.withdrawalMetadata.withdraw.fee_fixed === "number"
                    ? `${props.withdrawalMetadata.withdraw.fee_fixed} ${props.asset && props.asset.getCode()}`
                    : "",
                  typeof props.withdrawalMetadata.withdraw.fee_percent === "number"
                    ? `${props.withdrawalMetadata.withdraw.fee_percent}%`
                    : ""
                ].join(" + ") || "unknown"
              }
            />
          ) : null}
        </HorizontalLayout>
        <Portal target={props.actionsRef.element}>
          <DialogActionsBox desktopStyle={{ marginTop: 0 }}>
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

export default React.memo(WithdrawalRequestFormDetails)

export { FormValues as DetailsFormValues }

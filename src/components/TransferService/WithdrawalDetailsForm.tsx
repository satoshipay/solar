import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { Asset } from "stellar-sdk"
import { AssetTransferInfo } from "@satoshipay/stellar-transfer"
import { RefStateObject } from "../../hooks/userinterface"
import { useLoadingState } from "../../hooks/util"
import theme from "../../theme"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { ReadOnlyTextfield } from "../Form/FormFields"
import { VerticalLayout } from "../Layout/Box"
import Portal from "../Portal"
import { formatDescriptionText } from "./formatters"
import { WithdrawalStates } from "./statemachine"
import { FormBuilder, FormBuilderField } from "./FormBuilder"
import FormLayout from "./FormLayout"
import { Paragraph, Summary } from "./Sidebar"
import { WithdrawalContext } from "./WithdrawalProvider"

type FormValues = Record<string, string>

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

interface WithdrawalFeeProps {
  asset: Asset
  metadata: AssetTransferInfo["withdraw"]
}

const WithdrawalFee = React.memo(function WithdrawalFee(props: WithdrawalFeeProps) {
  if (!props.metadata) {
    return null
  }
  return (
    <ReadOnlyTextfield
      inputProps={{
        style: {
          color: theme.palette.text.secondary
        }
      }}
      label="Withdrawal fee"
      style={{ marginTop: 24 }}
      value={
        [
          typeof props.metadata.fee_fixed === "number"
            ? `${props.metadata.fee_fixed} ${props.asset && props.asset.getCode()}`
            : "",
          typeof props.metadata.fee_percent === "number" ? `${props.metadata.fee_percent}%` : ""
        ].join(" + ") || "unknown"
      }
    />
  )
})

interface WithdrawalDetailsFormProps {
  active: boolean
  assetTransferInfos: AssetTransferInfo[]
  dialogActionsRef: RefStateObject | undefined
  state: WithdrawalStates.EnterBasics
}

function WithdrawalDetailsForm(props: WithdrawalDetailsFormProps) {
  const { account, actions } = React.useContext(WithdrawalContext)

  const formID = React.useMemo(() => nanoid(), [])
  const [submissionState, handleSubmission] = useLoadingState({ throwOnError: true })

  const assetInfo = props.assetTransferInfos.find(info => info.asset.equals(props.state.asset))

  const [formValues, setFormValues] = React.useState<FormValues>(
    (props.state.formValues as Record<string, string>) || {}
  )
  const setFormValue = (fieldName: string, newValue: string) =>
    setFormValues(prevFormValues => ({ ...prevFormValues, [fieldName]: newValue }))

  const amount = formValues.amount ? BigNumber(formValues.amount) : undefined

  const handleSubmit = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault()

      handleSubmission(
        actions.submitWithdrawalFieldValues({
          ...props.state,
          formValues: {
            ...props.state.formValues,
            ...postprocessFormValues(formValues, props.state.method),
            account: account.publicKey
          }
        })
      )
    },
    [actions.submitWithdrawalFieldValues, amount, formValues]
  )

  const methodMetadata =
    assetInfo && assetInfo.withdraw && assetInfo.withdraw.types ? assetInfo.withdraw.types[props.state.method] : null

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

  const isDisabled = hasEmptyMandatoryFields || !validAmount || !validEmail

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <VerticalLayout>
        <FormLayout>
          {fields.dest ? (
            <FormBuilderField
              autoFocus={process.env.PLATFORM !== "ios" && props.active}
              name="Destination account"
              descriptor={fields.dest || {}}
              onChange={event => setFormValue("dest", event.target.value)}
              style={{ marginTop: 24 }}
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
              style={{ marginTop: 24 }}
              value={formValues.dest_extra || ""}
            />
          ) : null}
        </FormLayout>
        <FormBuilder
          fields={filterObject(
            fields,
            (value, key) => [...automaticallySetValues, "amount", "dest", "dest_extra"].indexOf(key) === -1
          )}
          fieldStyle={{ marginTop: 24 }}
          formValues={formValues}
          onSetFormValue={setFormValue}
        />
        <FormLayout>
          <WithdrawalFee asset={props.state.asset} metadata={assetInfo && assetInfo.withdraw} />
        </FormLayout>
        <Portal desktop="inline" target={props.dialogActionsRef && props.dialogActionsRef.element}>
          <DialogActionsBox>
            <ActionButton
              disabled={isDisabled}
              form={formID}
              loading={submissionState && submissionState.type === "pending"}
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

const Sidebar = () => (
  <Summary headline="Enter details">
    <Paragraph>Provide further details about your intended withdrawal.</Paragraph>
    <Paragraph>The information you have to enter depends on what the asset issuer requests.</Paragraph>
  </Summary>
)

const DetailsFormView = Object.assign(React.memo(WithdrawalDetailsForm), { Sidebar })

export default DetailsFormView

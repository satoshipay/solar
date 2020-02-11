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
import { TransferStates } from "./statemachine"
import { DepositContext } from "./DepositProvider"
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

interface ReadOnlyFieldProps {
  asset: Asset
  metadata: AssetTransferInfo["withdraw"]
}

const MinMaxAmount = React.memo(function MinMaxAmount(props: ReadOnlyFieldProps) {
  const assetCode = props.asset ? props.asset.getCode() : ""

  if (!props.metadata || (!props.metadata.min_amount && !props.metadata.max_amount)) {
    return null
  }
  return (
    <ReadOnlyTextfield
      inputProps={{
        style: {
          color: theme.palette.text.secondary
        }
      }}
      label="Amount"
      style={{ marginTop: 24 }}
      value={[
        props.metadata.min_amount ? `Min. ${props.metadata.min_amount} ${assetCode}`.trim() : null,
        props.metadata.max_amount ? `Max. ${props.metadata.max_amount} ${assetCode}`.trim() : null
      ]
        .filter(str => Boolean(str))
        .join(" / ")}
    />
  )
})

const filterEmptyStrings = (array: string[]): string[] => array.filter(str => str !== "")

const TransferFee = React.memo(function TransferFee(props: ReadOnlyFieldProps & { type: "deposit" | "withdrawal" }) {
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
      label={props.type === "deposit" ? "Deposit fee" : "Withdrawal fee"}
      style={{ marginTop: 24 }}
      value={
        filterEmptyStrings([
          typeof props.metadata.fee_fixed === "number"
            ? `${props.metadata.fee_fixed} ${props.asset && props.asset.getCode()}`
            : "",
          typeof props.metadata.fee_percent === "number" ? `${props.metadata.fee_percent}%` : ""
        ]).join(" + ") || "unknown"
      }
    />
  )
})

interface TransferDetailsFormProps {
  active: boolean
  assetTransferInfos: AssetTransferInfo[]
  dialogActionsRef: RefStateObject | undefined
  state: TransferStates.EnterBasics
  type: "deposit" | "withdrawal"
}

function TransferDetailsForm(props: TransferDetailsFormProps) {
  const { account, actions } =
    props.type === "deposit" ? React.useContext(DepositContext) : React.useContext(WithdrawalContext)

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
        actions.submitTransferFieldValues({
          ...props.state,
          formValues: {
            ...props.state.formValues,
            ...postprocessFormValues(formValues, props.state.method),
            account: account.publicKey
          }
        })
      )
    },
    [actions.submitTransferFieldValues, amount, formValues]
  )

  const methodMetadata = (() => {
    if (props.type === "deposit") {
      return assetInfo && assetInfo.deposit ? assetInfo.deposit : null
    } else {
      return assetInfo && assetInfo.withdraw && assetInfo.withdraw.types
        ? assetInfo.withdraw.types[props.state.method]
        : null
    }
  })()

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
          <MinMaxAmount asset={props.state.asset} metadata={assetInfo && assetInfo.withdraw} />
          <TransferFee asset={props.state.asset} metadata={assetInfo && assetInfo.withdraw} type={props.type} />
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

const Sidebar = (props: { type: "deposit" | "withdrawal" }) =>
  props.type === "deposit" ? (
    <Summary headline="Deposit details">
      <Paragraph>Further details about your intended deposit.</Paragraph>
      <Paragraph>
        Depending on what the asset issuer requests you may have to enter additional information here.
      </Paragraph>
    </Summary>
  ) : (
    <Summary headline="Withdrawal details">
      <Paragraph>Further details about your intended withdrawal.</Paragraph>
      <Paragraph>
        Depending on what the asset issuer requests you may have to enter additional information here.
      </Paragraph>
    </Summary>
  )

const DetailsFormView = Object.assign(React.memo(TransferDetailsForm), { Sidebar })

export default DetailsFormView

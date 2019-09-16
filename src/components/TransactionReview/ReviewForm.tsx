import nanoid from "nanoid"
import React from "react"
import { Transaction } from "stellar-sdk"
import TextField from "@material-ui/core/TextField"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import { Account } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { RefStateObject } from "../../hooks/userinterface"
import { renderFormFieldError } from "../../lib/errors"
import { SignatureRequest } from "../../lib/multisig-service"
import { createCheapTxID, selectNetwork } from "../../lib/transaction"
import { openLink } from "../../platform/links"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { VerticalLayout } from "../Layout/Box"
import DismissalConfirmationDialog from "./DismissalConfirmationDialog"
import TransactionSummary from "./TransactionSummary"
import Portal from "../Portal"

type FormErrors = { [formField in keyof FormValues]: Error | null }

interface FormValues {
  password: string | null
}

interface Props {
  account: Account
  actionsRef: RefStateObject
  disabled?: boolean
  passwordError?: Error | null
  showHash?: boolean
  showSource?: boolean
  signatureRequest?: SignatureRequest
  transaction: Transaction
  onClose?: () => void
  onConfirm?: (formValues: FormValues) => any
}

function TxConfirmationForm(props: Props) {
  const { onConfirm = () => undefined } = props

  const settings = React.useContext(SettingsContext)
  const formID = React.useMemo(() => nanoid(), [])
  const [dismissalConfirmationPending, setDismissalConfirmationPending] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<FormErrors>>({})
  const [formValues, setFormValues] = React.useState<FormValues>({ password: null })

  const passwordError = props.passwordError || errors.password

  const cancelDismissal = React.useCallback(() => setDismissalConfirmationPending(false), [])
  const requestDismissalConfirmation = React.useCallback(() => setDismissalConfirmationPending(true), [])

  const dismissSignatureRequest = React.useCallback(
    () => {
      if (!props.signatureRequest) return

      settings.ignoreSignatureRequest(props.signatureRequest.hash)
      setDismissalConfirmationPending(false)

      if (props.onClose) {
        props.onClose()
      }
    },
    [props.signatureRequest]
  )
  const setFormValue = <Key extends keyof FormValues>(key: keyof FormValues, value: FormValues[Key]) => {
    setFormValues(prevValues => ({
      ...prevValues,
      [key]: value
    }))
  }

  const openInStellarExpert = React.useCallback(
    () => {
      selectNetwork(props.account.testnet)
      openLink(
        `https://stellar.expert/explorer/${
          props.account.testnet ? "testnet" : "public"
        }/tx/${props.transaction.hash().toString("hex")}`
      )
    },
    [createCheapTxID(props.transaction)]
  )

  const handleFormSubmission = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault()

      if (props.disabled) {
        // Just a precaution; we shouldn't even get here if the component is disabled
        return
      }

      if (props.account.requiresPassword && !formValues.password) {
        return setErrors({
          ...errors,
          password: new Error("Password required")
        })
      }

      setErrors({})
      onConfirm(formValues)
    },
    [props.account, props.disabled, formValues, onConfirm]
  )

  return (
    <form id={formID} noValidate onSubmit={handleFormSubmission}>
      <VerticalLayout>
        <TransactionSummary
          account={props.account}
          onHashClick={props.disabled && !props.signatureRequest ? openInStellarExpert : undefined}
          showHash={props.showHash === undefined ? props.disabled : props.showHash}
          showSource={props.showSource}
          signatureRequest={props.signatureRequest}
          testnet={props.account.testnet}
          transaction={props.transaction}
        />
        {props.account.requiresPassword && !props.disabled ? (
          <TextField
            autoFocus={process.env.PLATFORM !== "ios"}
            error={Boolean(passwordError)}
            label={passwordError ? renderFormFieldError(passwordError) : "Password"}
            type="password"
            fullWidth
            margin="dense"
            value={formValues.password || ""}
            onChange={event => setFormValue("password", event.target.value)}
            style={{ marginTop: 16, marginBottom: 32 }}
          />
        ) : null}
      </VerticalLayout>
      <Portal target={props.actionsRef.element}>
        <DialogActionsBox smallDialog={props.disabled && !props.signatureRequest}>
          {props.signatureRequest ? (
            <ActionButton icon={<CloseIcon style={{ fontSize: "140%" }} />} onClick={requestDismissalConfirmation}>
              Dismiss
            </ActionButton>
          ) : null}
          {props.disabled ? null : (
            <ActionButton icon={<CheckIcon />} form={formID} onClick={() => undefined} type="submit">
              Confirm
            </ActionButton>
          )}
        </DialogActionsBox>
      </Portal>
      <DismissalConfirmationDialog
        onCancel={cancelDismissal}
        onConfirm={dismissSignatureRequest}
        open={dismissalConfirmationPending}
      />
    </form>
  )
}

export default React.memo(TxConfirmationForm)

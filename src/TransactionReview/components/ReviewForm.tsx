import BigNumber from "big.js"
import nanoid from "nanoid"
import React from "react"
import { useTranslation } from "react-i18next"
import { Transaction } from "stellar-sdk"
import Typography from "@material-ui/core/Typography"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import OpenInNewIcon from "@material-ui/icons/OpenInNew"
import { Account } from "~App/contexts/accounts"
import { SettingsContext } from "~App/contexts/settings"
import { RefStateObject } from "~Generic/hooks/userinterface"
import { renderFormFieldError } from "~Generic/lib/errors"
import { SignatureRequest } from "~Generic/lib/multisig-service"
import { openLink } from "~Platform/links"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { VerticalLayout } from "~Layout/components/Box"
import Portal from "~Generic/components/Portal"
import DismissalConfirmationDialog from "./DismissalConfirmationDialog"
import TransactionSummary from "./TransactionSummary"
import PasswordField from "~Generic/components/PasswordField"

type FormErrors = { [formField in keyof FormValues]: Error | null } & { signing: Error }

interface FormValues {
  password: string | null
}

interface Props {
  account: Account
  actionsRef: RefStateObject | undefined
  disabled?: boolean
  loading?: boolean
  passwordError?: Error | null
  showHash?: boolean
  showSource?: boolean
  signatureRequest?: SignatureRequest
  transaction: Transaction
  onClose?: () => void
  onConfirm?: (formValues: FormValues) => any
}

function TxConfirmationForm(props: Props) {
  const { onConfirm = () => undefined, onClose } = props

  const settings = React.useContext(SettingsContext)
  const formID = React.useMemo(() => nanoid(), [])
  const [dismissalConfirmationPending, setDismissalConfirmationPending] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<FormErrors>>({})
  const [formValues, setFormValues] = React.useState<FormValues>({ password: null })
  const [loading, setLoading] = React.useState<boolean>(false)
  const [hardwareVerificationPending, setHardwareVerificationPending] = React.useState<boolean>(false)
  const { t } = useTranslation()

  const passwordError = props.passwordError || errors.password

  const cancelDismissal = React.useCallback(() => setDismissalConfirmationPending(false), [])
  const requestDismissalConfirmation = React.useCallback(() => setDismissalConfirmationPending(true), [])

  const dismissSignatureRequest = React.useCallback(() => {
    if (!props.signatureRequest) return

    settings.ignoreSignatureRequest(props.signatureRequest.hash)
    setDismissalConfirmationPending(false)

    if (onClose) {
      onClose()
    }
  }, [onClose, props.signatureRequest, settings])

  const setFormValue = <Key extends keyof FormValues>(key: keyof FormValues, value: FormValues[Key]) => {
    setFormValues(prevValues => ({
      ...prevValues,
      [key]: value
    }))
  }

  const openInStellarExpert = React.useCallback(() => {
    openLink(
      `https://stellar.expert/explorer/${
        props.account.testnet ? "testnet" : "public"
      }/tx/${props.transaction.hash().toString("hex")}`
    )
  }, [props.account.testnet, props.transaction])

  const handleTextFieldChange = React.useCallback(event => setFormValue("password", event.target.value), [])

  const handleFormSubmission = React.useCallback(async () => {
    if (props.disabled) {
      // Just a precaution; we shouldn't even get here if the component is disabled
      return
    }

    if (props.account.requiresPassword && !formValues.password) {
      setLoading(false)
      return setErrors({
        ...errors,
        password: new Error(t("account.transaction-review.validation.password-required"))
      })
    }

    setErrors({})
    try {
      await onConfirm(formValues)
    } catch (error) {
      if (error.name === "SignWithHardwareWalletError") {
        setErrors({
          ...errors,
          signing: new Error(t("account.transaction-review.validation.signing-failed"))
        })
      } else {
        // re-throw error
        throw error
      }
    } finally {
      setLoading(false)
    }
  }, [props.disabled, props.account.requiresPassword, formValues, errors, t, onConfirm])

  const DismissIcon = React.useMemo(() => <CloseIcon style={{ fontSize: "140%" }} />, [])
  const ConfirmIcon = React.useMemo(() => <CheckIcon />, [])

  const isOrderCancellation = props.transaction.operations.every(
    op =>
      (op.type === "manageBuyOffer" && BigNumber(op.buyAmount).eq(0)) ||
      (op.type === "manageSellOffer" && BigNumber(op.amount).eq(0))
  )

  const showLoadingAndSubmit = React.useCallback(() => {
    setLoading(true)

    if (props.account.isHardwareWalletAccount) {
      setHardwareVerificationPending(true)
    }

    handleFormSubmission()
  }, [handleFormSubmission, props.account.isHardwareWalletAccount])

  return (
    <form id={formID} noValidate>
      <VerticalLayout>
        <TransactionSummary
          account={props.account}
          canSubmit={!props.disabled}
          showHash={props.showHash === undefined ? props.disabled : props.showHash}
          showSource={props.showSource}
          signatureRequest={props.signatureRequest}
          testnet={props.account.testnet}
          transaction={props.transaction}
        />
        {props.account.requiresPassword && !props.disabled ? (
          <PasswordField
            autoFocus={process.env.PLATFORM !== "ios"}
            error={Boolean(passwordError)}
            label={
              passwordError
                ? renderFormFieldError(passwordError, t)
                : t("account.transaction-review.textfield.password.label")
            }
            fullWidth
            margin="dense"
            value={formValues.password || ""}
            onChange={handleTextFieldChange}
            style={{ margin: "32px auto 0", maxWidth: 300 }}
          />
        ) : null}
        {hardwareVerificationPending ? (
          <Typography variant="body1" style={{ margin: "32px auto 0" }}>
            {errors.signing ? errors.signing.message : t("account.transaction-review.hardware-verification-pending")}
          </Typography>
        ) : null}
      </VerticalLayout>
      <Portal desktop="inline" target={props.actionsRef && props.actionsRef.element}>
        <DialogActionsBox smallDialog={props.disabled && !props.signatureRequest}>
          {props.signatureRequest ? (
            <ActionButton icon={DismissIcon} onClick={requestDismissalConfirmation}>
              {t("account.transaction-review.action.dismiss")}
            </ActionButton>
          ) : null}
          {props.disabled ? null : (
            <ActionButton
              disabled={props.loading || loading}
              icon={ConfirmIcon}
              form={formID}
              loading={props.loading || loading}
              onClick={showLoadingAndSubmit}
              type="submit"
            >
              {isOrderCancellation
                ? t("account.transaction-review.action.cancel-order")
                : t("account.transaction-review.action.confirm")}
            </ActionButton>
          )}
          {props.disabled && !props.signatureRequest ? (
            <ActionButton icon={<OpenInNewIcon />} onClick={openInStellarExpert} type="secondary">
              {t("account.transaction-review.action.inspect")}
            </ActionButton>
          ) : null}
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

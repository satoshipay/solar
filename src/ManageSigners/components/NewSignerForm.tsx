import React from "react"
import { useTranslation } from "react-i18next"
import IconButton from "@material-ui/core/IconButton"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import TextField from "@material-ui/core/TextField"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import PersonAddIcon from "@material-ui/icons/PersonAdd"
import { useIsSmallMobile, useIsMobile } from "~Generic/hooks/userinterface"
import { HorizontalLayout } from "~Layout/components/Box"

interface FormValues {
  publicKey: string
  weight: string
}

interface FormErrors {
  publicKey?: Error
  weight?: Error
}

interface Props {
  errors: FormErrors
  values: FormValues
  onCancel: () => void
  onSubmit: () => void
  onUpdate: (values: Partial<FormValues>) => void
  style?: React.CSSProperties
}

function NewSignerForm(props: Props) {
  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()
  const { t } = useTranslation()

  return (
    <ListItem style={props.style}>
      <ListItemIcon>
        <PersonAddIcon style={{ fontSize: "2rem" }} />
      </ListItemIcon>
      <ListItemText>
        <HorizontalLayout>
          <TextField
            autoFocus={process.env.PLATFORM !== "ios"}
            error={!!props.errors.publicKey}
            label={
              props.errors.publicKey
                ? props.errors.publicKey.message
                : t("account-settings.manage-signers.signers-editor.new-signer.label")
            }
            placeholder={
              isSmallScreen
                ? t("account-settings.manage-signers.signers-editor.new-signer.placeholder.short")
                : t("account-settings.manage-signers.signers-editor.new-signer.placeholder.long")
            }
            onChange={event => props.onUpdate({ publicKey: event.target.value.trim() })}
            style={{ flexGrow: 1 }}
            InputProps={isTinyScreen ? { style: { fontSize: "0.8rem" } } : undefined}
            value={props.values.publicKey}
          />
        </HorizontalLayout>
      </ListItemText>
      <ListItemIcon style={{ marginLeft: 8, minWidth: 0 }}>
        <IconButton onClick={props.onSubmit}>
          <CheckIcon />
        </IconButton>
      </ListItemIcon>
      <ListItemIcon style={{ minWidth: 0 }}>
        <IconButton onClick={props.onCancel}>
          <CloseIcon />
        </IconButton>
      </ListItemIcon>
    </ListItem>
  )
}

export default NewSignerForm

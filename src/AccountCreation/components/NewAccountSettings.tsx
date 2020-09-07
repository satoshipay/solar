import React from "react"
import List from "@material-ui/core/List"
import { useIsMobile } from "~Generic/hooks/userinterface"
import PasswordSetting from "./PasswordSetting"
import SecretKeyImport from "./SecretKeyImport"
import { AccountCreation, AccountCreationErrors } from "../types/types"

interface NewAccountSettingsProps {
  accountCreation: AccountCreation
  errors: AccountCreationErrors
  onUpdateAccountCreation: (update: Partial<AccountCreation>) => void
}

function NewAccountSettings(props: NewAccountSettingsProps) {
  const { onUpdateAccountCreation } = props
  const isSmallScreen = useIsMobile()

  const togglePasswordProtection = React.useCallback(() => {
    onUpdateAccountCreation({ requiresPassword: !props.accountCreation.requiresPassword })
  }, [props.accountCreation.requiresPassword, onUpdateAccountCreation])

  const toggleUseMnemonic = React.useCallback(
    (useMnemonic: boolean) => {
      onUpdateAccountCreation({ useMnemonic })
    },
    [onUpdateAccountCreation]
  )

  const updatePassword = React.useCallback(
    (password: string) => {
      onUpdateAccountCreation({ password })
    },
    [onUpdateAccountCreation]
  )

  const updateRepeatedPassword = React.useCallback(
    (repeatedPassword: string) => {
      onUpdateAccountCreation({ repeatedPassword })
    },
    [onUpdateAccountCreation]
  )

  const updateSecretKey = React.useCallback(
    (secretKey: string) => {
      onUpdateAccountCreation({ secretKey })
    },
    [onUpdateAccountCreation]
  )

  const updateMnemonic = React.useCallback(
    (mnemonic: string) => {
      onUpdateAccountCreation({ mnemonic })
    },
    [onUpdateAccountCreation]
  )

  return (
    <List style={{ padding: isSmallScreen ? 0 : "24px 16px" }}>
      {props.accountCreation.import ? (
        <SecretKeyImport
          error={props.errors.secretKey}
          onEnterSecretKey={updateSecretKey}
          onEnterMnemonic={updateMnemonic}
          onToggleUseMnemonic={toggleUseMnemonic}
          secretKey={props.accountCreation.secretKey || ""}
          mnemonic={props.accountCreation.mnemonic || ""}
          useMnemonic={props.accountCreation.useMnemonic}
        />
      ) : null}
      <PasswordSetting
        error={props.errors.password}
        password={props.accountCreation.password}
        onEnterPassword={updatePassword}
        onRepeatPassword={updateRepeatedPassword}
        onTogglePassword={togglePasswordProtection}
        repeatedPassword={props.accountCreation.repeatedPassword}
        requiresPassword={props.accountCreation.requiresPassword}
      />
    </List>
  )
}

export default React.memo(NewAccountSettings)

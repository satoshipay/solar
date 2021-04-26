import React from "react"
import { useTranslation } from "react-i18next"
import Collapse from "@material-ui/core/Collapse"
import InputAdornment from "@material-ui/core/InputAdornment"
import ListItemText from "@material-ui/core/ListItemText"
import Switch from "@material-ui/core/Switch"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import GroupIcon from "@material-ui/icons/Group"
import InfoIcon from "@material-ui/icons/InfoOutlined"
import AccountSettingsItem from "~AccountSettings/components/AccountSettingsItem"
import { QRReader } from "~Generic/components/FormFields"
import { useIsMobile } from "~Generic/hooks/userinterface"

const FundingNote = React.memo(function FundingNote() {
  const isSmallScreen = useIsMobile()
  const { t } = useTranslation()

  return (
    <Typography color="textSecondary" style={{ alignItems: "center", display: "flex", marginTop: 8 }} variant="body2">
      <InfoIcon style={{ fontSize: "1.3em", marginLeft: "-1.4em", marginRight: "0.4em" }} />
      {isSmallScreen
        ? t("create-account.inputs.multisig-account.explanation-short")
        : t("create-account.inputs.multisig-account.explanation-long")}
    </Typography>
  )
})

interface MultisigAccountPubKeyProps {
  enabled: boolean
  error?: string
  import?: boolean
  onEnter: (value: string) => void
  onToggle?: () => void
  value: string
}

function MultisigAccountPubKey(props: MultisigAccountPubKeyProps) {
  const { onEnter } = props
  const { t } = useTranslation()

  const inputProps = React.useMemo(
    () => ({
      style: { textOverflow: "ellipsis" }
    }),
    []
  )

  const InputProps = React.useMemo(
    () => ({
      endAdornment: (
        <InputAdornment disableTypography position="end">
          <QRReader onScan={onEnter} />
        </InputAdornment>
      )
    }),
    [onEnter]
  )

  const handleInput = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onEnter(event.target.value.trim())
    },
    [onEnter]
  )

  return (
    <>
      <AccountSettingsItem
        icon={
          !props.onToggle ? <GroupIcon /> : <Switch checked={props.enabled} color="primary" onChange={props.onToggle} />
        }
        onClick={props.onToggle}
      >
        {props.import ? (
          <ListItemText
            primary={t("create-account.options.cosigner-import.label")}
            secondary={t("create-account.options.cosigner-import.description")}
            style={{ marginLeft: 8 }}
          />
        ) : (
          <ListItemText
            primary={t("create-account.options.cosigner.label")}
            secondary={t("create-account.options.cosigner.description")}
            style={{ marginLeft: 8 }}
          />
        )}
      </AccountSettingsItem>
      <Collapse in={props.enabled}>
        <AccountSettingsItem icon={null} subItem>
          <ListItemText style={{ marginLeft: 12, marginRight: 56, marginTop: -8 }}>
            <TextField
              error={Boolean(props.error)}
              helperText={props.error ? t("create-account.inputs.multisig-account.helper-text") : ""}
              label={props.error || t("create-account.inputs.multisig-account.label")}
              placeholder={t("create-account.inputs.multisig-account.placeholder")}
              fullWidth
              margin="normal"
              value={props.value}
              onChange={handleInput}
              inputProps={inputProps}
              InputProps={InputProps}
            />
            {props.import ? null : <FundingNote />}
          </ListItemText>
        </AccountSettingsItem>
      </Collapse>
    </>
  )
}

export default React.memo(MultisigAccountPubKey)

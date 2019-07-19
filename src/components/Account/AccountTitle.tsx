import React from "react"
import IconButton from "@material-ui/core/IconButton"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import Tooltip from "@material-ui/core/Tooltip"
import CheckIcon from "@material-ui/icons/Check"
import ClearIcon from "@material-ui/icons/Clear"
import EditIcon from "@material-ui/icons/Edit"
import GroupIcon from "@material-ui/icons/Group"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account, AccountsContext } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useRouter, ObservedAccountData } from "../../hooks"
import * as routes from "../../routes"
import { containsStellarGuardAsSigner } from "../../lib/stellar-guard"
import { primaryBackgroundColor } from "../../theme"
import StellarGuardIcon from "../Icon/StellarGuard"
import { HorizontalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"

function PasswordStatus(props: { safe: boolean; style?: React.CSSProperties }) {
  return (
    <Tooltip title={props.safe ? "Password protected" : "No password"}>
      <VerifiedUserIcon style={{ opacity: props.safe ? 1 : 0.5, ...props.style }} />
    </Tooltip>
  )
}

function TestnetBadge(props: { style?: React.CSSProperties }) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px",
    background: "white",
    borderRadius: 3,
    color: primaryBackgroundColor,
    fontSize: "50%",
    fontWeight: "bold",
    lineHeight: "100%",
    textTransform: "uppercase",
    ...props.style
  }
  return <span style={style}>Testnet</span>
}

// tslint:disable-next-line no-shadowed-variable
const Badges = React.memo(function Badges(props: { account: Account; accountData: ObservedAccountData }) {
  const multiSigIcon = containsStellarGuardAsSigner(props.accountData.signers) ? (
    <Tooltip title="StellarGuard Protection">
      <StellarGuardIcon style={{ fontSize: "80%", marginRight: 8 }} />
    </Tooltip>
  ) : (
    <Tooltip title="Multi-Signature Account">
      <GroupIcon style={{ fontSize: "120%", marginRight: 8 }} />
    </Tooltip>
  )

  return (
    <HorizontalLayout display="inline-flex" alignItems="center" width="auto" fontSize="1.5rem">
      {props.account.testnet ? <TestnetBadge style={{ marginRight: 16 }} /> : null}
      {props.accountData.signers.length > 1 ? multiSigIcon : null}
      <PasswordStatus safe={props.account.requiresPassword} style={{ fontSize: "90%", marginTop: "-0.05em" }} />
    </HorizontalLayout>
  )
})

interface TitleTextFieldProps {
  actions?: React.ReactNode
  editable: boolean
  inputRef?: React.Ref<HTMLInputElement>
  onChange: TextFieldProps["onChange"]
  onKeyDown?: TextFieldProps["onKeyDown"]
  mode: "editing" | "readonly"
  style?: React.CSSProperties
  value: string
}

function TitleTextField(props: TitleTextFieldProps) {
  return (
    <TextField
      inputProps={{
        size: props.value.length,
        style: {
          cursor: props.mode === "editing" ? "text" : "default"
        }
      }}
      inputRef={props.inputRef}
      InputProps={{
        disableUnderline: true,
        endAdornment: !props.editable ? null : (
          <InputAdornment position="end" style={{ height: "auto" }}>
            {props.actions}
          </InputAdornment>
        ),
        readOnly: props.mode === "readonly",
        style: {
          color: "inherit",
          font: "inherit"
        }
      }}
      onChange={props.onChange}
      onKeyDown={props.onKeyDown}
      style={{
        color: "inherit",
        ...props.style
      }}
      value={props.value}
    />
  )
}

interface AccountTitleProps {
  account: Account
  accountData: ObservedAccountData
  actions: React.ReactNode
  editable?: boolean
}

function AccountTitle(props: AccountTitleProps) {
  const router = useRouter()
  const { renameAccount } = React.useContext(AccountsContext)

  const [mode, setMode] = React.useState<TitleTextFieldProps["mode"]>("readonly")
  const [name, setName] = React.useState<string>(props.account.name)
  const onNavigateBack = React.useCallback(() => router.history.push(routes.allAccounts()), [])

  const inputRef = React.createRef<HTMLInputElement>()

  const handleNameEditing = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value),
    []
  )
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        renameAccount(props.account.id, name).catch(trackError)
        setMode("readonly")
      } else if (event.key === "Escape") {
        setName(props.account.name)
        setMode("readonly")
      }
    },
    [props.account, name]
  )

  const applyRenaming = React.useCallback(
    () => {
      renameAccount(props.account.id, name).catch(trackError)
      setMode("readonly")
    },
    [props.account, name]
  )
  const cancelRenaming = React.useCallback(
    () => {
      setName(props.account.name)
      setMode("readonly")
    },
    [props.account]
  )
  const toggleMode = React.useCallback(() => {
    setMode(prevMode => (prevMode === "editing" ? "readonly" : "editing"))
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }, [])

  const editActions = React.useMemo(
    () => (
      <>
        <IconButton onClick={applyRenaming} style={{ color: "inherit" }}>
          <CheckIcon />
        </IconButton>
        <IconButton onClick={cancelRenaming} style={{ color: "inherit" }}>
          <ClearIcon />
        </IconButton>
      </>
    ),
    [applyRenaming, cancelRenaming]
  )

  const readonlyActions = React.useMemo(
    () => (
      <IconButton onClick={toggleMode} style={{ color: "inherit" }}>
        <EditIcon />
      </IconButton>
    ),
    [toggleMode]
  )

  return (
    <MainTitle
      actions={props.actions}
      badges={props.editable ? null : <Badges account={props.account} accountData={props.accountData} />}
      onBack={onNavigateBack}
      style={{ marginTop: -12, marginLeft: 0 }}
      title={
        <TitleTextField
          actions={mode === "readonly" ? readonlyActions : editActions}
          editable={props.editable || false}
          inputRef={inputRef}
          onChange={handleNameEditing}
          onKeyDown={handleKeyDown}
          mode={mode}
          value={name}
        />
      }
      titleColor="inherit"
      titleStyle={{
        overflowY: "visible"
      }}
    />
  )
}

export default React.memo(AccountTitle)

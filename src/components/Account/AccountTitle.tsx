import React from "react"
import IconButton from "@material-ui/core/IconButton"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import Tooltip from "@material-ui/core/Tooltip"
import makeStyles from "@material-ui/core/styles/makeStyles"
import CheckIcon from "@material-ui/icons/Check"
import ClearIcon from "@material-ui/icons/Clear"
import EditIcon from "@material-ui/icons/Edit"
import GroupIcon from "@material-ui/icons/Group"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account, AccountsContext } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { useIsMobile, useRouter } from "../../hooks/userinterface"
import { containsStellarGuardAsSigner } from "../../lib/stellar-guard"
import { primaryBackgroundColor } from "../../theme"
import StellarGuardIcon from "../Icon/StellarGuard"
import { HorizontalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"

function clearTextSelection() {
  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
  }
}

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

interface BadgesProps {
  account: Account
}

export const Badges = React.memo(function Badges(props: BadgesProps) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)

  const multiSigIcon = containsStellarGuardAsSigner(accountData.signers) ? (
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
      {accountData.signers.length > 1 ? multiSigIcon : null}
      <PasswordStatus safe={props.account.requiresPassword} style={{ fontSize: "90%", marginTop: "-0.05em" }} />
    </HorizontalLayout>
  )
})

const useTitleTextfieldStyles = makeStyles({
  input: {
    borderRadius: 0,
    caretColor: "white",
    "&::selection": {
      background: "rgba(255, 255, 255, 0.2)",
      color: "white"
    }
  },
  underlinedInput: {
    borderBottom: "1px solid white"
  }
})

interface TitleTextFieldProps {
  actions?: React.ReactNode
  inputRef?: React.Ref<HTMLInputElement>
  onChange: TextFieldProps["onChange"]
  onClick?: () => void
  onKeyDown?: TextFieldProps["onKeyDown"]
  preventClicks?: boolean
  mode: "editing" | "readonly"
  showEdit: boolean
  showUnderlineOnEdit?: boolean
  style?: React.CSSProperties
  value: string
}

function TitleTextField(props: TitleTextFieldProps) {
  const classes = useTitleTextfieldStyles()
  return (
    <TextField
      inputProps={{
        className: `${classes.input} ${
          props.mode === "editing" && props.showUnderlineOnEdit ? classes.underlinedInput : ""
        }`,
        onClick: props.onClick,
        size: Math.max(props.value.length + 1, 4),
        style: {
          cursor: props.mode === "editing" ? "text" : "default",
          height: 48,
          padding: 0,
          textOverflow: "ellipsis"
        }
      }}
      inputRef={props.inputRef}
      InputProps={{
        disableUnderline: true,
        endAdornment: !props.showEdit ? null : (
          <InputAdornment position="end" style={{ height: "auto" }}>
            {props.actions}
          </InputAdornment>
        ),
        readOnly: props.mode === "readonly",
        style: {
          color: "inherit",
          font: "inherit",
          height: 48, // Will otherwise jump when edit icon button appears
          pointerEvents: props.preventClicks ? "none" : undefined
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
  actions: React.ReactNode
  badges: React.ReactNode
  editable?: boolean
  onNavigateBack: () => void
}

function AccountTitle(props: AccountTitleProps) {
  const router = useRouter()
  const isSmallScreen = useIsMobile()
  const { renameAccount } = React.useContext(AccountsContext)

  const [mode, setMode] = React.useState<TitleTextFieldProps["mode"]>("readonly")
  const [name, setName] = React.useState<string>(props.account.name)

  const inputRef = React.createRef<HTMLInputElement>()

  React.useEffect(() => {
    return router.history.listen(() => {
      setMode("readonly")
      clearTextSelection()
    })
  }, [router.history])

  const handleNameEditing = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value),
    []
  )
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        renameAccount(props.account.id, name).catch(trackError)
        setMode("readonly")
        clearTextSelection()
      } else if (event.key === "Escape") {
        setName(props.account.name)
        setMode("readonly")
        clearTextSelection()
      }
    },
    [renameAccount, props.account.id, props.account.name, name]
  )

  const applyRenaming = React.useCallback(() => {
    renameAccount(props.account.id, name).catch(trackError)
    setMode("readonly")
    clearTextSelection()
  }, [renameAccount, props.account.id, name])
  const cancelRenaming = React.useCallback(() => {
    setName(props.account.name)
    setMode("readonly")
    clearTextSelection()
  }, [props.account])
  const switchToEditMode = React.useCallback(() => {
    if (props.editable) {
      setMode("editing")
    }
  }, [props.editable])
  const toggleMode = React.useCallback(() => {
    setMode(prevMode => (prevMode === "editing" ? "readonly" : "editing"))
    // Doesn't work on iOS, even leads to weird broken behavior
    if (inputRef.current && process.env.PLATFORM !== "ios") {
      inputRef.current.select()
      inputRef.current.focus()
    }
  }, [inputRef])

  const editActions = React.useMemo(
    () => (
      <>
        <IconButton onClick={applyRenaming} style={{ color: "inherit" }}>
          <CheckIcon />
        </IconButton>
        <IconButton onClick={cancelRenaming} style={{ color: "inherit", marginLeft: isSmallScreen ? -12 : 0 }}>
          <ClearIcon />
        </IconButton>
      </>
    ),
    [applyRenaming, cancelRenaming, isSmallScreen]
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
      badges={props.editable ? null : props.badges}
      onBack={props.onNavigateBack}
      style={{ marginTop: -12, marginLeft: 0 }}
      title={
        <TitleTextField
          actions={mode === "readonly" ? readonlyActions : editActions}
          inputRef={inputRef}
          onChange={handleNameEditing}
          onClick={props.editable ? switchToEditMode : undefined}
          onKeyDown={handleKeyDown}
          preventClicks={!props.editable}
          mode={mode}
          showEdit={props.editable || false}
          // Since we cannot auto-select the text on iOS, highlight that it's editable by underline
          showUnderlineOnEdit={process.env.PLATFORM === "ios"}
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

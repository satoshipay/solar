import React from "react"
import IconButton from "@material-ui/core/IconButton"
import { InputProps } from "@material-ui/core/Input"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { OutlinedTextFieldProps, TextFieldProps } from "@material-ui/core/TextField"
import { makeStyles } from "@material-ui/core/styles"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import SearchIcon from "@material-ui/icons/Search"
import { trackError } from "../../context/notifications"
import QRImportDialog from "../Dialog/QRImport"
import QRReaderIcon from "../Icon/QRReader"

const desktopQRIconStyle: React.CSSProperties = { fontSize: 20 }
const mobileQRIconStyle: React.CSSProperties = {}

interface Props {
  onScan: (data: string) => void
}

export const QRReader = React.memo(function QRReader(props: Props) {
  const { onScan } = props
  const isTouchScreen = useMediaQuery("(hover: none)")
  const [isQRReaderOpen, setQRReaderOpen] = React.useState(false)
  const closeQRReader = React.useCallback(() => setQRReaderOpen(false), [])
  const openQRReader = React.useCallback(() => setQRReaderOpen(true), [])

  const handleQRScan = React.useCallback(
    (data: string | null) => {
      if (data) {
        onScan(data)
        closeQRReader()
      }
    },
    [closeQRReader, onScan]
  )

  return (
    <>
      <IconButton onClick={openQRReader} tabIndex={99}>
        <QRReaderIcon style={isTouchScreen ? mobileQRIconStyle : desktopQRIconStyle} />
      </IconButton>
      <QRImportDialog open={isQRReaderOpen} onClose={closeQRReader} onError={trackError} onScan={handleQRScan} />
    </>
  )
})

type PriceInputProps = TextFieldProps & {
  assetCode: React.ReactNode
  assetStyle?: React.CSSProperties
  readOnly?: boolean
}

// tslint:disable-next-line no-shadowed-variable
export const PriceInput = React.memo(function PriceInput(props: PriceInputProps) {
  const { assetCode, assetStyle, readOnly, ...textfieldProps } = props
  return (
    <TextField
      {...textfieldProps}
      inputProps={{
        pattern: "[0-9]*",
        inputMode: "decimal"
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment
            disableTypography
            position="end"
            style={{
              pointerEvents: typeof assetCode === "string" ? "none" : undefined,
              ...assetStyle
            }}
          >
            {assetCode}
          </InputAdornment>
        ),
        readOnly,
        ...textfieldProps.InputProps
      }}
      type={
        // Prevent `The specified value (...) is not a valid number` warning
        readOnly ? undefined : "number"
      }
      style={{
        pointerEvents: props.readOnly ? "none" : undefined,
        ...textfieldProps.style
      }}
    />
  )
})

const useReadOnlyTextfieldStyles = makeStyles({
  root: {
    "&:focus": {
      outline: "none"
    },
    "&&, && > div": {
      color: "inherit"
    }
  }
})

type ReadOnlyTextfieldProps = TextFieldProps & {
  disableUnderline?: boolean
  multiline?: boolean
}

export const ReadOnlyTextfield = React.memo(function ReadOnlyTextfield(props: ReadOnlyTextfieldProps) {
  const { disableUnderline, multiline, ...textfieldProps } = props
  const classes = useReadOnlyTextfieldStyles()

  // tslint:disable-next-line no-shadowed-variable
  const InputProps: InputProps = {
    disableUnderline,
    multiline,
    disabled: true,
    readOnly: true,
    ...props.InputProps
  }
  return (
    <TextField
      {...textfieldProps}
      className={`${classes.root} ${props.className || ""}`}
      tabIndex={-1}
      InputProps={InputProps}
    />
  )
})

export const SearchField = React.memo(function SearchField(props: Omit<OutlinedTextFieldProps, "variant">) {
  return (
    <TextField
      fullWidth
      variant="outlined"
      {...props}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <SearchIcon />
          </InputAdornment>
        ),
        ...props.InputProps
      }}
    />
  )
})

import React from "react"
import IconButton from "@material-ui/core/IconButton"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import { trackError } from "../../context/notifications"
import QRImportDialog from "../Dialog/QRImport"
import QRReaderIcon from "../Icon/QRReader"

interface Props {
  iconStyle?: React.CSSProperties
  onScan: (data: string) => void
}

// tslint:disable-next-line no-shadowed-variable
export const QRReader = React.memo(function QRReader(props: Props) {
  const [isQRReaderOpen, setQRReaderOpen] = React.useState(false)
  const closeQRReader = React.useCallback(() => setQRReaderOpen(false), [])
  const openQRReader = React.useCallback(() => setQRReaderOpen(true), [])

  const handleQRScan = React.useCallback(
    (data: string | null) => {
      if (data) {
        props.onScan(data)
        closeQRReader()
      }
    },
    [props.onScan]
  )

  return (
    <>
      <IconButton onClick={openQRReader} tabIndex={99}>
        <QRReaderIcon style={props.iconStyle} />
      </IconButton>
      <QRImportDialog open={isQRReaderOpen} onClose={closeQRReader} onError={trackError} onScan={handleQRScan} />
    </>
  )
})

type PriceInputProps = TextFieldProps & { assetCode: React.ReactNode; readOnly?: boolean }

// tslint:disable-next-line no-shadowed-variable
export const PriceInput = React.memo(function PriceInput(props: PriceInputProps) {
  const { assetCode, readOnly, ...textfieldProps } = props
  return (
    <TextField
      {...textfieldProps}
      InputProps={{
        endAdornment: (
          <InputAdornment
            disableTypography
            position="end"
            style={{ pointerEvents: typeof assetCode === "string" ? "none" : undefined }}
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

export function ReadOnlyTextfield(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      style={{
        pointerEvents: "none",
        ...props.style
      }}
      tabIndex={-1}
      InputProps={{
        readOnly: true,
        ...props.InputProps
      }}
    />
  )
}

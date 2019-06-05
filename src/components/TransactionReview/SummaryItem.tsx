import React from "react"
import FormControl from "@material-ui/core/FormControl"
import FormHelperText from "@material-ui/core/FormHelperText"
import Input from "@material-ui/core/Input"
import InputLabel from "@material-ui/core/InputLabel"
import ListItem from "@material-ui/core/ListItem"
import Typography from "@material-ui/core/Typography"
import { HorizontalLayout } from "../Layout/Box"

interface SummaryDetailsFieldProps {
  fullWidth?: boolean
  helperText?: React.ReactNode
  label: React.ReactNode
  value: React.ReactNode
}

/** Based on TextField */
// tslint:disable-next-line no-shadowed-variable
export const SummaryDetailsField = React.memo(function SummaryDetailsField(props: SummaryDetailsFieldProps) {
  const InputComponent = React.useCallback(() => <>{props.value}</>, [props.value])
  return (
    <FormControl style={{ flex: props.fullWidth ? "0 0 100%" : "0 0 48%" }}>
      <InputLabel style={{ overflow: "visible", textTransform: "none", whiteSpace: "nowrap" }}>
        {props.label}
      </InputLabel>
      <Input
        disableUnderline
        inputComponent={InputComponent}
        style={{ maxWidth: "100%", overflow: "hidden", wordBreak: "break-word" }}
      />
      {props.helperText ? <FormHelperText>{props.helperText}</FormHelperText> : null}
    </FormControl>
  )
})

interface SummaryDetailsLineProps {
  children: React.ReactNode
}

function SummaryDetailsLine(props: SummaryDetailsLineProps) {
  return (
    <HorizontalLayout style={{ flexWrap: "wrap", justifyContent: "space-between", width: "100%" }}>
      {props.children}
    </HorizontalLayout>
  )
}

interface SummaryItemProps {
  children: React.ReactNode
  heading?: React.ReactNode
}

export function SummaryItem(props: SummaryItemProps) {
  return (
    <ListItem
      disableGutters
      style={{
        display: "flex",
        alignItems: "flex-start",
        flexDirection: "column",
        padding: "1px 0"
      }}
    >
      {props.heading ? (
        <Typography
          color="textSecondary"
          style={{
            display: "block",
            padding: "11px 0",
            fontSize: 18,
            fontWeight: 400,
            lineHeight: "18px",
            textAlign: "left"
          }}
          variant="subtitle1"
        >
          {props.heading}
        </Typography>
      ) : null}
      <SummaryDetailsLine>{props.children}</SummaryDetailsLine>
    </ListItem>
  )
}

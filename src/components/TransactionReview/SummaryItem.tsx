import React from "react"
import { useTranslation } from "react-i18next"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import ExpandIcon from "@material-ui/icons/ExpandMore"
import { HorizontalLayout } from "../Layout/Box"
import { ReadOnlyTextfield } from "../Form/FormFields"

interface SummaryDetailsFieldProps {
  fullWidth?: boolean
  helperText?: React.ReactNode
  label: React.ReactNode
  value: React.ReactNode
}

/** Based on TextField */
export const SummaryDetailsField = React.memo(function SummaryDetailsField(props: SummaryDetailsFieldProps) {
  const InputComponent = React.useCallback(() => <>{props.value}</>, [props.value])
  return (
    <ReadOnlyTextfield
      disableUnderline
      helperText={props.helperText}
      label={props.label}
      style={{ flex: props.fullWidth ? "0 0 100%" : "0 0 48%" }}
      InputProps={{
        inputComponent: InputComponent,
        style: {
          maxWidth: "100%",
          overflow: "hidden",
          wordBreak: "break-word"
        }
      }}
      InputLabelProps={{
        style: {
          whiteSpace: "nowrap"
        }
      }}
    />
  )
})

const summaryDetailsLineStyle: React.CSSProperties = {
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginTop: 12,
  width: "100%"
}

interface SummaryDetailsLineProps {
  children: React.ReactNode
}

function SummaryDetailsLine(props: SummaryDetailsLineProps) {
  return <HorizontalLayout style={summaryDetailsLineStyle}>{props.children}</HorizontalLayout>
}

const useSummaryItemStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "flex-start",
    borderBottom: "none",
    flexDirection: "column",
    padding: "1px 0"
  },
  heading: {
    display: "block",
    padding: "16px 0",
    fontSize: 18,
    fontWeight: 400,
    lineHeight: "18px",
    textAlign: "left"
  },
  noButton: {
    background: "transparent",
    boxShadow: "none !important"
  }
})

interface SummaryItemProps {
  children: React.ReactNode
  heading?: React.ReactNode
}

export function SummaryItem(props: SummaryItemProps) {
  const classes = useSummaryItemStyles()
  return (
    <ListItem className={classes.root} component="div" disableGutters>
      {props.heading ? (
        <Typography color="textSecondary" className={classes.heading} variant="subtitle1">
          {props.heading}
        </Typography>
      ) : null}
      <SummaryDetailsLine>{props.children}</SummaryDetailsLine>
    </ListItem>
  )
}

const useShowMoreItemStyles = makeStyles({
  root: {
    border: "none",
    margin: "-8px 0",
    padding: "8px 0"
  },
  button: {
    boxShadow: "none !important",
    display: "flex",
    margin: 0,

    "&:not(:hover)": {
      background: "transparent"
    }
  }
})

interface ShowMoreItemProps {
  onClick: () => void
  style?: React.CSSProperties
}

export const ShowMoreItem = React.memo(function ShowMoreItem(props: ShowMoreItemProps) {
  const classes = useShowMoreItemStyles()
  const { t } = useTranslation()
  return (
    <ListItem
      button
      classes={{ root: classes.root, button: classes.button }}
      component="div"
      disableGutters
      onClick={props.onClick}
      style={props.style}
    >
      <ListItemText disableTypography>
        <Typography style={{ display: "flex", alignItems: "center", justifyContent: "center" }} variant="button">
          {t("transaction-review.action.show-more")} <ExpandIcon />
        </Typography>
      </ListItemText>
    </ListItem>
  )
})

import React from "react"
import { useTranslation } from "react-i18next"
import { MemoHash, MemoID, MemoNone, MemoReturn, MemoText, MemoType } from "stellar-sdk"
import ListItemText from "@material-ui/core/ListItemText"
import MenuItem from "@material-ui/core/MenuItem"
import { makeStyles } from "@material-ui/core/styles"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"

interface MemoItemProps {
  disabled?: boolean
  key: string
  memoType: MemoType
  value: string
}

const MemoItem = React.memo(
  React.forwardRef(function MemoItem(props: MemoItemProps, ref: React.Ref<HTMLLIElement>) {
    const { memoType, ...reducedProps } = props

    return (
      <MenuItem {...reducedProps} key={props.key} ref={ref} value={props.value}>
        <ListItemText>{memoType}</ListItemText>
      </MenuItem>
    )
  })
)

const useMemoSelectorStyles = makeStyles({
  helperText: {
    maxWidth: 100,
    whiteSpace: "nowrap"
  },
  input: {
    minWidth: 72
  },
  select: {
    fontSize: 18,
    fontWeight: 400
  },
  unselected: {
    opacity: 0.5
  }
})

interface MemoSelectorProps {
  autoFocus?: TextFieldProps["autoFocus"]
  children?: React.ReactNode
  className?: string
  disabledMemos?: MemoType[]
  disableUnderline?: boolean
  helperText?: TextFieldProps["helperText"]
  inputError?: string
  label?: TextFieldProps["label"]
  margin?: TextFieldProps["margin"]
  minWidth?: number | string
  name?: string
  onChange?: (memoType: MemoType) => void
  style?: React.CSSProperties
  value?: MemoType
}

function MemoSelector(props: MemoSelectorProps) {
  const { onChange } = props
  const classes = useMemoSelectorStyles()

  const { t } = useTranslation()

  const memoTypes = React.useMemo<MemoType[]>(() => [MemoNone, MemoText, MemoID, MemoHash, MemoReturn], [])

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<{ name?: any; value: any }>, child: React.ComponentElement<MemoItemProps, any>) => {
      const matchingMemo = memoTypes.find(memoType => memoType === child.props.memoType)

      if (matchingMemo) {
        if (onChange) {
          onChange(matchingMemo)
        }
      } else {
        // tslint:disable-next-line no-console
        console.error(`Invariant violation: Trustline ${child.props.memoType} selected, but no matching memo found.`)
      }
    },
    [memoTypes, onChange]
  )

  return (
    <TextField
      autoFocus={props.autoFocus}
      className={props.className}
      error={Boolean(props.inputError)}
      helperText={props.helperText}
      label={props.inputError ? props.inputError : props.label}
      margin={props.margin}
      onChange={handleChange as any}
      name={props.name}
      placeholder={t("generic.memo-selector.select")}
      select
      style={{ flexShrink: 0, ...props.style }}
      value={props.value || ""}
      FormHelperTextProps={{
        className: classes.helperText
      }}
      InputProps={{
        classes: {
          root: classes.input
        },
        style: {
          minWidth: props.minWidth
        }
      }}
      SelectProps={{
        classes: {
          root: props.value ? undefined : classes.unselected,
          select: classes.select
        },
        displayEmpty: !props.value,
        disableUnderline: props.disableUnderline,
        renderValue: () => props.value || t("generic.memo-selector.select")
      }}
    >
      {props.value ? null : (
        <MenuItem disabled value="">
          {t("generic.memo-selector.placeholder")}
        </MenuItem>
      )}
      {memoTypes.map(memoType => (
        <MemoItem
          memoType={memoType}
          disabled={props.disabledMemos && props.disabledMemos.some(someMemo => someMemo === memoType)}
          key={memoType}
          value={memoType}
        />
      ))}
    </TextField>
  )
}

export default React.memo(MemoSelector)

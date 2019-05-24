import * as React from "react"
import { useEffect } from "react"
import { TextField, Typography, PropTypes } from "@material-ui/core"
import { OutlinedInputProps } from "@material-ui/core/OutlinedInput"

export interface InlineEditableProps {
  autofocus?: boolean
  color?: PropTypes.Color
  displayContent: React.ReactNode
  editable?: boolean
  disableEditOnClick?: boolean
  editableContent?: string
  onChange?: (newValue: string) => void
  selectOnFocus?: boolean
  style?: React.CSSProperties
  textFieldInputProps?: Partial<OutlinedInputProps>
}

function InlineEditField(props: InlineEditableProps) {
  const [editing, setEditing] = React.useState<boolean>(props.editable ? props.editable : false)
  const [editedText, setEditedText] = React.useState<string>(props.editableContent ? props.editableContent : "")
  const [inputElement, setInputElement] = React.useState<HTMLInputElement | null>(null)

  useEffect(
    () => {
      if (props.autofocus && inputElement) {
        inputElement.focus()
        startEditing()
      }
    },
    [inputElement]
  )

  useEffect(
    () => {
      if (props.editable) {
        setEditing(props.editable)
      }

      if (editing && inputElement) {
        startEditing()
      }
    },
    [props.editable]
  )

  const selectAll = () => {
    if (inputElement) {
      inputElement.setSelectionRange(0, inputElement.value.length)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault()
      abortEditing()
    } else if (event.key === "Enter") {
      event.preventDefault()
      finishEditing()
    }
  }

  const startEditing = () => {
    setEditing(true)

    if (props.selectOnFocus) {
      selectAll()
    }
  }

  const abortEditing = () => {
    setEditing(false)

    if (props.onChange && props.editableContent) {
      props.onChange(props.editableContent) // return original value
    }
  }

  const finishEditing = () => {
    const newValue = inputElement && inputElement.value
    setEditing(false)
    if (newValue && props.onChange) {
      props.onChange(newValue)
    }
  }

  const onDisplayContentClick = () => {
    if (!props.disableEditOnClick) {
      startEditing()
    }
  }

  const renderNormalComponent = () => {
    return (
      <Typography onFocus={startEditing} color={props.color} onClick={onDisplayContentClick} style={props.style}>
        {props.displayContent}
      </Typography>
    )
  }

  const renderEditingComponent = () => {
    return (
      <TextField
        color={props.color}
        inputRef={input => setInputElement(input)}
        InputProps={props.textFieldInputProps}
        onBlur={finishEditing}
        onChange={event => setEditedText(event.target.value)}
        onKeyDown={handleKeyDown}
        value={editedText}
      />
    )
  }

  return editing ? renderEditingComponent() : renderNormalComponent()
}

export default InlineEditField

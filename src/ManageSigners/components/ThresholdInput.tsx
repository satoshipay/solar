import React from "react"
import TextField from "@material-ui/core/TextField"
import { getSignatureThreshold } from "../lib/editor"
import { MultisigEditorContext } from "./MultisigEditorContext"

function ThresholdInput() {
  const { editorState, setEditorState } = React.useContext(MultisigEditorContext)
  const { preset } = editorState

  const value = String(getSignatureThreshold(preset))

  const setThreshold = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.persist()

      setEditorState(prev => {
        const newThreshold = Number.parseInt(event.target.value, 10)

        if ("requiredKeyWeight" in prev.preset) {
          return {
            ...prev,
            preset: {
              ...prev.preset,
              requiredKeyWeight: newThreshold
            }
          }
        } else if ("thresholds" in prev.preset) {
          return {
            ...prev,
            preset: {
              ...prev.preset,
              thresholds: {
                high_threshold: newThreshold,
                med_threshold: newThreshold,
                low_threshold: newThreshold
              }
            }
          }
        } else {
          throw Error(`Cannot update thresholds for multi-sig preset of type "${prev.preset.type}"`)
        }
      })
    },
    [setEditorState]
  )

  return (
    <TextField
      inputProps={{
        min: 1,
        style: {
          maxWidth: 32,
          padding: "16px 14px",
          textAlign: "center"
        }
      }}
      onChange={setThreshold}
      type="number"
      value={value}
      variant="outlined"
    />
  )
}

export default React.memo(ThresholdInput)

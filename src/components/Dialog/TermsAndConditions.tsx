import React from "react"
import { useState } from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import Checkbox from "@material-ui/core/Checkbox"
import Fade, { FadeProps } from "@material-ui/core/Fade"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import FormGroup from "@material-ui/core/FormGroup"
import Typography from "@material-ui/core/Typography"
import { VerticalLayout } from "../Layout/Box"
import { Section } from "../Layout/Page"

const CheckboxLabel = (props: { children: React.ReactNode }) => (
  <span style={{ color: "white", fontSize: "120%" }}>{props.children}</span>
)
const Link = (props: { children: React.ReactNode; href: string }) => (
  <a href={props.href} style={{ color: "inherit", fontWeight: "bold", textDecoration: "underline" }} target="_blank">
    {props.children}
  </a>
)
const Transition = (props: FadeProps) => <Fade {...props} timeout={{ enter: 0 }} />

interface Props {
  open: boolean
  onConfirm: () => void
}

function TermsAndConditions(props: Props) {
  const [checkedNotes, setCheckedNotes] = useState([false, false])
  const allConfirmed = checkedNotes.every(isChecked => isChecked)

  const toggleNoteChecked = (index: number) => {
    const updatedNoteChecks = [...checkedNotes]
    updatedNoteChecks[index] = !updatedNoteChecks[index]
    setCheckedNotes(updatedNoteChecks)
  }

  return (
    <Dialog open={props.open} fullScreen TransitionComponent={Transition}>
      <Section brandColored top style={{ display: "flex", flexDirection: "column" }}>
        <VerticalLayout grow={1} justifyContent="center" margin="0 auto" padding="3vh 4vw" maxWidth={800}>
          <Typography color="inherit" variant="display1">
            Welcome to Solar
          </Typography>
          <FormGroup style={{ margin: "3em 0" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkedNotes[0]}
                  onChange={() => toggleNoteChecked(0)}
                  style={{ color: "inherit" }}
                />
              }
              label={
                <CheckboxLabel>
                  I understand that I am responsible for the safety of my funds and that Solar is not able to recover my
                  funds in case of data loss or if I lose my credentials.
                </CheckboxLabel>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkedNotes[1]}
                  onChange={() => toggleNoteChecked(1)}
                  style={{ color: "inherit" }}
                />
              }
              label={
                <CheckboxLabel>
                  I have read, understood and agree to the&nbsp;
                  <Link href="https://solarwallet.io/terms.html">Terms and Conditions</Link> of Solar.
                </CheckboxLabel>
              }
            />
          </FormGroup>
          <Button
            disabled={!allConfirmed}
            onClick={props.onConfirm}
            size="large"
            style={{ alignSelf: "center" }}
            variant="contained"
          >
            Confirm
          </Button>
        </VerticalLayout>
      </Section>
    </Dialog>
  )
}

export default TermsAndConditions

import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import Checkbox from "@material-ui/core/Checkbox"
import Fade from "@material-ui/core/Fade"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import FormGroup from "@material-ui/core/FormGroup"
import Typography from "@material-ui/core/Typography"
import { VerticalLayout } from "./Layout/Box"
import { Section } from "./Layout/Page"

const Transition = React.forwardRef((props: TransitionProps, ref) => <Fade ref={ref} {...props} appear={false} />)

function CheckboxLabel(props: { children: React.ReactNode }) {
  return <span style={{ color: "white", fontSize: "120%" }}>{props.children}</span>
}

function ExternalLink(props: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={props.href}
      style={{ color: "inherit", fontWeight: "bold", textDecoration: "underline" }}
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.children}
    </a>
  )
}

interface Props {
  open: boolean
  onConfirm: () => void
}

function TermsAndConditions(props: Props) {
  const [checkedNotes, setCheckedNotes] = React.useState([false, false])
  const allConfirmed = checkedNotes.every(isChecked => isChecked)

  const toggleNoteChecked = (index: number) => {
    const updatedNoteChecks = [...checkedNotes]
    updatedNoteChecks[index] = !updatedNoteChecks[index]
    setCheckedNotes(updatedNoteChecks)
  }

  return (
    <Section brandColored top bottom style={{ display: "flex", flexDirection: "column" }}>
      <VerticalLayout grow={1} justifyContent="center" margin="0 auto" padding="3vh 4vw" maxWidth={800}>
        <Typography color="inherit" variant="h4">
          Welcome to Solar
        </Typography>
        <FormGroup style={{ margin: "3em 0" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={checkedNotes[0]}
                onChange={() => toggleNoteChecked(0)}
                style={{ alignSelf: "flex-start", color: "inherit", marginTop: -7 }}
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
                style={{ alignSelf: "flex-start", color: "inherit", marginTop: -7 }}
              />
            }
            label={
              <CheckboxLabel>
                I have read, understood and agree to the{" "}
                <ExternalLink href="https://solarwallet.io/terms.html">Terms and Conditions</ExternalLink> &amp;{" "}
                <ExternalLink href="https://solarwallet.io/privacy.html">Privacy policy</ExternalLink> of Solar.
              </CheckboxLabel>
            }
            style={{
              marginTop: 16
            }}
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
  )
}

function TermsAndConditionsDialog(props: Props) {
  // Super important to make sure that the Dialog unmounts on exit, so it won't act as an invisible click blocker!
  return (
    <Dialog
      open={props.open}
      fullScreen
      PaperProps={{
        // let the <Section> set the padding, so it will color the iPhone X top notch
        style: { padding: 0 }
      }}
      TransitionComponent={Transition}
      TransitionProps={{ unmountOnExit: true }}
    >
      <TermsAndConditions {...props} />
    </Dialog>
  )
}

export default React.memo(TermsAndConditionsDialog)

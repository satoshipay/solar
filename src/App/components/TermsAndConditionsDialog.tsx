import React from "react"
import { useTranslation, Trans } from "react-i18next"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import Checkbox from "@material-ui/core/Checkbox"
import Fade from "@material-ui/core/Fade"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import FormGroup from "@material-ui/core/FormGroup"
import Typography from "@material-ui/core/Typography"
import { VerticalLayout } from "~Layout/components/Box"
import { Section } from "~Layout/components/Page"

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
  const { t } = useTranslation()

  const toggleNoteChecked = (index: number) => {
    const updatedNoteChecks = [...checkedNotes]
    updatedNoteChecks[index] = !updatedNoteChecks[index]
    setCheckedNotes(updatedNoteChecks)
  }

  return (
    <Section brandColored top bottom style={{ display: "flex", flexDirection: "column" }}>
      <VerticalLayout grow={1} justifyContent="center" margin="0 auto" padding="3vh 4vw" maxWidth={800}>
        <Typography color="inherit" variant="h4">
          {t("app.terms-and-conditions.header")}
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
            label={<CheckboxLabel>{t("app.terms-and-conditions.checkbox.1.label")}</CheckboxLabel>}
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
                <Trans i18nKey="app.terms-and-conditions.checkbox.2.label">
                  I have read, understood and agree to the
                  <ExternalLink href="https://solarwallet.io/terms.html">Terms and Conditions</ExternalLink> &amp;
                  <ExternalLink href="https://solarwallet.io/privacy.html">Privacy policy</ExternalLink> of Solar.
                </Trans>
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
          {t("app.terms-and-conditions.action.confirm")}
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

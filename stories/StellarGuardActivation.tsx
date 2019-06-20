import React from "react"
import { storiesOf } from "@storybook/react"
import StellarGuardActivationDialog from "../src/components/Dialog/StellarGuardActivation"
import { Dialog, Slide } from "@material-ui/core"

const DialogTransition = (props: any) => <Slide {...props} direction="left" />

storiesOf("StellarGuard Activation", module).add("StellarGuard Activation Dialog", () => (
  <Dialog open={true} fullScreen onClose={undefined} TransitionComponent={DialogTransition}>
    <StellarGuardActivationDialog onClose={() => undefined} />
  </Dialog>
))

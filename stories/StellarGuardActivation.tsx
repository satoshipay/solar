import React from "react"
import { storiesOf } from "@storybook/react"
import StellarGuardActivationDialog from "../src/components/Dialog/StellarGuardActivation"
import { Dialog, Slide } from "@material-ui/core"
import { Transaction } from "stellar-base"
import { parseStellarUri, TransactionStellarUri } from "@stellarguard/stellar-uri"

const DialogTransition = (props: any) => <Slide {...props} direction="left" />

const uri = parseStellarUri(
  "web+stellar:tx?xdr=AAAAADPMT6JWh08TPGnc5nd6eUtw0CfJA4kQjkHZzGEQqGWHAAAAZAAGXSAAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAAM8xPolaHTxM8adzmd3p5S3DQJ8kDiRCOQdnMYRCoZYcAAAAAAAAAAACYloAAAAAAAAAAAA%3D%3D&msg=order+number+123&callback=url%3Ahttps%3A%2F%2Fexample.com%2Fstellar&origin_domain=test.stellarguard.me&signature=TwoRggPieF6UorVeLHSYZhRRKv8mMwezVUiirms%2F8N6oe8EZOCYKSsNWAn2o1rVb8jhEVte%2FEFZcRkzyXEZdBw%3D%3D"
)

const transaction = new Transaction((uri as TransactionStellarUri).xdr)

storiesOf("StellarGuard Activation", module).add("StellarGuard Activation Dialog", () => (
  <Dialog open={true} fullScreen onClose={undefined} TransitionComponent={DialogTransition}>
    <StellarGuardActivationDialog transaction={transaction} onClose={() => undefined} />
  </Dialog>
))

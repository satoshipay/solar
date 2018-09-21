import React from "react"
import { Asset } from "stellar-sdk"
import Drawer from "@material-ui/core/Drawer"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../stores/accounts"
import CreatePaymentForm, { PaymentCreationValues } from "../Form/CreatePayment"
import CloseButton from "./CloseButton"
import TestnetBadge from "./TestnetBadge"

interface PaymentFormDrawerProps {
  account: Account
  open: boolean
  onClose: () => void
  onSubmit: (values: PaymentCreationValues) => void
  trustedAssets?: Asset[]
  txCreationPending?: boolean
}

const PaymentFormDrawer = (props: PaymentFormDrawerProps) => {
  const trustedAssets = props.trustedAssets || [Asset.native()]
  return (
    <Drawer open={props.open} anchor="right" onClose={props.onClose}>
      <Card
        style={{
          position: "relative",
          height: "100%",
          padding: "0 12px",
          width: "90vw",
          maxWidth: "700px"
        }}
      >
        <CloseButton onClick={props.onClose} />
        <CardContent style={{ paddingTop: 24 }}>
          <Typography variant="headline" component="h2" style={{ marginTop: 8 }}>
            Send funds {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
          </Typography>
          <div style={{ marginTop: 40 }}>
            <CreatePaymentForm
              onSubmit={props.onSubmit}
              trustedAssets={trustedAssets}
              txCreationPending={props.txCreationPending}
            />
          </div>
        </CardContent>
      </Card>
    </Drawer>
  )
}

export default PaymentFormDrawer

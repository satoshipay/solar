import React from "react"
import Drawer from "@material-ui/core/Drawer"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import CloseIcon from "react-icons/lib/md/close"
import { Transaction } from "stellar-sdk"
import { Account } from "../../stores/accounts"
import CreatePaymentForm, { PaymentCreationValues } from "../Form/CreatePayment"

const CloseButton = (props: { onClick: (event: React.MouseEvent) => any }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    top: 16,
    right: 24,
    cursor: "pointer",
    lineHeight: 0
  }
  return (
    <div style={style} onClick={props.onClick}>
      <CloseIcon style={{ width: 32, height: 32 }} />
    </div>
  )
}

interface PaymentFormDrawerProps {
  account: Account
  open: boolean
  onClose: () => void
  onSubmit: (values: PaymentCreationValues) => void
}

const PaymentFormDrawer = (props: PaymentFormDrawerProps) => {
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
        <CardContent>
          <Typography variant="headline" component="h2">
            Send payment
          </Typography>
          <Typography gutterBottom variant="subheading" component="h3">
            {props.account.testnet ? "Testnet" : null}
          </Typography>
          <div style={{ marginTop: 32 }}>
            <CreatePaymentForm onSubmit={props.onSubmit} />
          </div>
        </CardContent>
      </Card>
    </Drawer>
  )
}

export default PaymentFormDrawer

import React from "react"
import Drawer from "@material-ui/core/Drawer"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import { Transaction } from "stellar-sdk"
import { Account } from "../../stores/accounts"
import TxConfirmationForm from "../Form/TxConfirmation"

interface TxConfirmationDrawerProps {
  account: Account
  open: boolean
  transaction: Transaction | null
  onClose: () => void
  onSubmitTransaction: (tx: Transaction, formValues: { password: string | null }) => void
}

const TxConfirmationDrawer = (props: TxConfirmationDrawerProps) => {
  return (
    <Drawer open={props.open} anchor="right" onClose={props.onClose}>
      <Card style={{ position: "relative", height: "100%", padding: "0 12px" }}>
        <CardContent>
          <Typography variant="headline" component="h2">
            Confirm payment
          </Typography>
          <Typography gutterBottom variant="subheading" component="h3">
            {props.account.testnet ? "Testnet" : null}
          </Typography>
          {props.transaction ? (
            <TxConfirmationForm
              transaction={props.transaction}
              account={props.account}
              onConfirm={formValues => props.onSubmitTransaction(props.transaction as Transaction, formValues)}
              onCancel={props.onClose}
            />
          ) : null}
        </CardContent>
      </Card>
    </Drawer>
  )
}

export default TxConfirmationDrawer

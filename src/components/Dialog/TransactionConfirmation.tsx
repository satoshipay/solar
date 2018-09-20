import React from "react"
import Drawer from "@material-ui/core/Drawer"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import { Transaction, TransactionOperation } from "stellar-sdk"
import { Account } from "../../stores/accounts"
import TxConfirmationForm from "../Form/TxConfirmation"

const isPaymentOperation = (operation: TransactionOperation) =>
  ["createAccount", "payment"].indexOf(operation.type) > -1

interface TxConfirmationDrawerProps {
  account: Account
  open: boolean
  transaction: Transaction | null
  onClose: () => void
  onSubmitTransaction: (tx: Transaction, formValues: { password: string | null }) => void
}

const TxConfirmationDrawer = (props: TxConfirmationDrawerProps) => {
  const title =
    props.transaction && props.transaction.operations.every(isPaymentOperation)
      ? "Confirm Payment"
      : "Confirm Transaction"

  return (
    <Drawer open={props.open} anchor="right" onClose={props.onClose}>
      <Card style={{ position: "relative", height: "100%", padding: "0 12px" }}>
        <CardContent>
          <Typography variant="headline" component="h2">
            {title}
          </Typography>
          <Typography gutterBottom variant="subheading" component="h3">
            {props.account.testnet ? "Testnet" : null}
          </Typography>
          {props.transaction ? (
            <div style={{ marginTop: 20 }}>
              <TxConfirmationForm
                transaction={props.transaction}
                account={props.account}
                onConfirm={formValues => props.onSubmitTransaction(props.transaction as Transaction, formValues)}
                onCancel={props.onClose}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Drawer>
  )
}

export default TxConfirmationDrawer

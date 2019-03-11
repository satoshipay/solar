import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import Slide from "@material-ui/core/Slide"
import TextField from "@material-ui/core/TextField"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import { ActionButton, DialogActionsBox } from "./Generic"

const Transition = (props: any) => <Slide {...props} direction="up" />

interface Props {
  account: Account
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction, signatureRequest?: null) => void
}

function CustomTrustlineDialog(props: Props) {
  const [code, setCode] = React.useState("")
  const [issuerPublicKey, setIssuerPublicKey] = React.useState("")
  const [limit, setLimit] = React.useState("")
  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

  const addAsset = async (asset: Asset, options: { limit?: string } = {}) => {
    try {
      const operations = [Operation.changeTrust({ asset, limit: options.limit })]

      setTxCreationPending(true)
      const transaction = await createTransaction(operations, {
        accountData,
        horizon: props.horizon,
        walletAccount: props.account
      })

      setTxCreationPending(false)
      await props.sendTransaction(transaction)

      props.onClose()
    } catch (error) {
      setTxCreationPending(false)
      trackError(error)
    }
  }
  const addCustomAsset = async () => {
    try {
      await addAsset(new Asset(code, issuerPublicKey), { limit: limit || undefined })
    } catch (error) {
      trackError(error)
    }
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} TransitionComponent={Transition}>
      <DialogTitle>Add Custom Asset</DialogTitle>
      <DialogContent>
        <form style={{ display: "block", width: "100%" }}>
          <TextField
            label="Code"
            placeholder="EURT, USDT, BTC, ..."
            autoFocus
            margin="dense"
            name="asset-code"
            value={code}
            onChange={event => setCode(event.target.value)}
          />
          <TextField
            fullWidth
            label="Issuer"
            placeholder="Issuing account public key"
            margin="dense"
            name="asset-issuer"
            value={issuerPublicKey}
            onChange={event => setIssuerPublicKey(event.target.value)}
          />
          <TextField
            fullWidth
            label="Limit (optional)"
            placeholder="Limit trust in this asset / maximum balance to hold"
            margin="dense"
            name="trust-limit"
            value={limit}
            onChange={event => setLimit(event.target.value)}
          />
          <DialogActionsBox>
            <ActionButton onClick={props.onClose}>Cancel</ActionButton>
            <ActionButton
              icon={<VerifiedUserIcon />}
              loading={txCreationPending}
              onClick={addCustomAsset}
              type="primary"
            >
              Trust Asset
            </ActionButton>
          </DialogActionsBox>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CustomTrustlineDialog

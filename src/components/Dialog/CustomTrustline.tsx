import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import TextField from "@material-ui/core/TextField"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { ObservedAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import { ActionButton, DialogActionsBox } from "./Generic"

interface Props {
  account: Account
  accountData: ObservedAccountData
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction, signatureRequest?: null) => void
}

function CustomTrustlineDialog(props: Props) {
  const [code, setCode] = React.useState("")
  const [issuerPublicKey, setIssuerPublicKey] = React.useState("")
  const [limit, setLimit] = React.useState("")
  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const isWidthMax450 = useMediaQuery("(max-width:450px)")

  const addAsset = async (asset: Asset, options: { limit?: string } = {}) => {
    try {
      const operations = [Operation.changeTrust({ asset, limit: options.limit })]

      setTxCreationPending(true)
      const transaction = await createTransaction(operations, {
        accountData: props.accountData,
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
    <>
      <DialogTitle>Add Custom Asset</DialogTitle>
      <DialogContent>
        <form style={{ display: "block", width: "100%" }}>
          <TextField
            label="Code"
            placeholder="EURT, USDT, BTC, ..."
            autoFocus={process.env.PLATFORM !== "ios"}
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
            type="number"
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
              {isWidthMax450 ? "Trust" : "Trust Asset"}
            </ActionButton>
          </DialogActionsBox>
        </form>
      </DialogContent>
    </>
  )
}

export default React.memo(CustomTrustlineDialog)

import React from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import DialogTitle from "@material-ui/core/DialogTitle"
import TextField from "@material-ui/core/TextField"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account } from "../../context/accounts"
import { ObservedAccountData } from "../../hooks"
import DialogBody from "../Dialog/DialogBody"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"

interface Props {
  account: Account
  accountData: ObservedAccountData
  createAddAssetTransaction: (asset: Asset, options: { limit?: string }) => any
  horizon: Server
  onClose: () => void
  sendTransaction: (createTransactionToSend: () => Promise<Transaction>) => any
  txCreationPending: boolean
}

function CustomTrustlineDialog(props: Props) {
  const [code, setCode] = React.useState("")
  const [issuerPublicKey, setIssuerPublicKey] = React.useState("")
  const [limit, setLimit] = React.useState("")
  const isWidthMax450 = useMediaQuery("(max-width:450px)")

  const createTransaction = () =>
    props.createAddAssetTransaction(new Asset(code, issuerPublicKey), { limit: limit || undefined })
  const addCustomAsset = () => props.sendTransaction(createTransaction)

  return (
    <DialogBody top={<DialogTitle>Add Custom Asset</DialogTitle>}>
      <form noValidate style={{ display: "block", width: "100%" }}>
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
        {/* Not in the DialogBody's `actions` prop as it's not a fullscreen dialog */}
        <DialogActionsBox preventMobileActionsBox>
          <ActionButton onClick={props.onClose}>Cancel</ActionButton>
          <ActionButton
            icon={<VerifiedUserIcon />}
            loading={props.txCreationPending}
            onClick={addCustomAsset}
            type="primary"
          >
            {isWidthMax450 ? "Trust" : "Trust Asset"}
          </ActionButton>
        </DialogActionsBox>
      </form>
    </DialogBody>
  )
}

export default React.memo(CustomTrustlineDialog)

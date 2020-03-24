import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, Server, Transaction } from "stellar-sdk"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import TextField from "@material-ui/core/TextField"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account } from "~App/contexts/accounts"
import { AccountData } from "~Generic/lib/account"
import DialogBody from "~Dialog/components/DialogBody"
import { ActionButton, DialogActionsBox } from "~Dialog/components/Generic"
import MainTitle from "~Generic/components/MainTitle"

interface Props {
  account: Account
  accountData: AccountData
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
  const { t } = useTranslation()

  const createTransaction = () =>
    props.createAddAssetTransaction(new Asset(code, issuerPublicKey), { limit: limit || undefined })
  const addCustomAsset = () => props.sendTransaction(createTransaction)

  return (
    <DialogBody
      top={<MainTitle hideBackButton onBack={props.onClose} title={t("account-settings.custom-trustline.title")} />}
    >
      <form noValidate style={{ display: "block", width: "100%" }}>
        <TextField
          label={t("account-settings.custom-trustline.textfield.code.label")}
          placeholder="EURT, USDT, BTC, ..."
          autoFocus={process.env.PLATFORM !== "ios"}
          margin="dense"
          name="asset-code"
          value={code}
          onChange={event => setCode(event.target.value)}
        />
        <TextField
          fullWidth
          label={t("account-settings.custom-trustline.textfield.issuer.label")}
          placeholder={t("account-settings.custom-trustline.textfield.issuer.placeholder")}
          margin="dense"
          name="asset-issuer"
          value={issuerPublicKey}
          onChange={event => setIssuerPublicKey(event.target.value)}
        />
        <TextField
          inputProps={{
            pattern: "[0-9]*",
            inputMode: "decimal"
          }}
          fullWidth
          label={t("account-settings.custom-trustline.textfield.limit.label")}
          placeholder={t("account-settings.custom-trustline.textfield.limit.placeholder")}
          margin="dense"
          name="trust-limit"
          value={limit}
          type="number"
          onChange={event => setLimit(event.target.value)}
        />
        {/* Not in the DialogBody's `actions` prop as it's not a fullscreen dialog */}
        <DialogActionsBox preventMobileActionsBox>
          <ActionButton onClick={props.onClose}>{t("account-settings.custom-trustline.action.cancel")}</ActionButton>
          <ActionButton
            icon={<VerifiedUserIcon />}
            loading={props.txCreationPending}
            onClick={addCustomAsset}
            type="primary"
          >
            {isWidthMax450
              ? t("account-settings.custom-trustline.action.trust.short")
              : t("account-settings.custom-trustline.action.trust.long")}
          </ActionButton>
        </DialogActionsBox>
      </form>
    </DialogBody>
  )
}

export default React.memo(CustomTrustlineDialog)

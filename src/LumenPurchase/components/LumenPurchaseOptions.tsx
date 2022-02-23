import fetch from "isomorphic-fetch"
import React from "react"
import { Trans, useTranslation } from "react-i18next"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import OpenInNewIcon from "@material-ui/icons/OpenInNew"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import { CustomError } from "~Generic/lib/errors"
import { openLink } from "~Platform/links"
import LegalConfirmation from "./LegalConfirmation"

// Fetch a signed URL for redirecting to MoonPay with a walletaddress
async function fetchSignedMoonpayURL(account: Account) {
  const baseURL = "https://ncy9jaxgqh.execute-api.eu-central-1.amazonaws.com/moonpay"
  const url = `${baseURL}?walletAddress=${account.accountID}&testnet=${account.testnet}`

  const response = await fetch(url)

  if (!response.ok) {
    const responseText = await response.text()
    throw CustomError("HttpRequestError", `HTTP fetch failed: ${responseText} \nService: ${url}`, {
      response: responseText,
      service: url
    })
  }

  const result = await response.json()
  return result.url
}

interface LumenDepositOptionsProps {
  account: Account
  onCloseDialog: () => void
}

function LumenDepositOptions(props: LumenDepositOptionsProps) {
  const { account, onCloseDialog } = props
  const [isLegalNoteOpen, setIsLegalNoteOpen] = React.useState(false)
  const { t } = useTranslation()

  const closeLegalNote = React.useCallback(() => setIsLegalNoteOpen(false), [])
  const openLegalNote = React.useCallback(() => setIsLegalNoteOpen(true), [])

  const navigateToMoonPay = React.useCallback(async () => {
    try {
      const signedMoonpayURL = await fetchSignedMoonpayURL(account)
      openLink(signedMoonpayURL)
      onCloseDialog()
    } catch (error) {
      trackError(error)
    }
  }, [account, onCloseDialog])

  return (
    <List style={{ margin: "16px auto", maxWidth: 600 }}>
      <ListItem button onClick={openLegalNote}>
        <ListItemText
          primary={t("account.purchase-lumens.moonpay.text.primary")}
          secondary={t("account.purchase-lumens.moonpay.text.secondary")}
        />
        <ListItemIcon style={{ minWidth: 24, marginLeft: 12 }}>
          <OpenInNewIcon />
        </ListItemIcon>
      </ListItem>
      <LegalConfirmation
        message={
          <Trans i18nKey="account.purchase-lumens.moonpay.legal-confirmation">
            You will be redirected to moonpay.io, a third-party service. The depositing process is operated by Moon Pay
            Ltd, not by Solar or SatoshiPay Ltd.
            <br />
            <br />
            Please contact the moonpay.io support for inquiries related to your deposit.
          </Trans>
        }
        onClose={closeLegalNote}
        open={isLegalNoteOpen}
        onConfirm={navigateToMoonPay}
      />
    </List>
  )
}

export default React.memo(LumenDepositOptions)

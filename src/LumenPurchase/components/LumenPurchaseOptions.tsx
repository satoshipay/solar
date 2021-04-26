import React from "react"
import { useTranslation, Trans } from "react-i18next"
import OpenInNewIcon from "@material-ui/icons/OpenInNew"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import { Account } from "~App/contexts/accounts"
import { openLink } from "~Platform/links"
import LegalConfirmation from "./LegalConfirmation"

function createMoonPayURLForAccount(account: Account) {
  const baseURL = "https://buy.moonpay.io/"
  const apiKEY = account.testnet ? "pk_test_RPUOOEJ7ZiAWlLFG6lbohDF9d2SqICX" : "pk_live_Xly1jO3hHE46AyMJO50lwoAk2VUCon"
  const currencyCode = "XLM"
  const colorCode = "1c8fea"
  return `${baseURL}?apiKey=${apiKEY}&currencyCode=${currencyCode}&enabledPaymentMethods=credit_debit_card,sepa_bank_transfer&walletAddress=${account.accountID}&colorCode=%23${colorCode}`
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

  const navigateToMoonPay = React.useCallback(() => {
    openLink(createMoonPayURLForAccount(account))
    onCloseDialog()
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

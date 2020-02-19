import React from "react"
import OpenInNewIcon from "@material-ui/icons/OpenInNew"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import { Account } from "../../context/accounts"
import { openLink } from "../../platform/links"
import LegalConfirmation from "./LegalConfirmation"

function createMoonPayURLForAccount(account: Account) {
  const baseURL = "https://buy.moonpay.io/"
  const apiKEY = account.testnet ? "pk_test_RPUOOEJ7ZiAWlLFG6lbohDF9d2SqICX" : "pk_live_Xly1jO3hHE46AyMJO50lwoAk2VUCon"
  const currencyCode = "XLM"
  const colorCode = "1c8fea"
  return `${baseURL}?apiKey=${apiKEY}&currencyCode=${currencyCode}&enabledPaymentMethods=credit_debit_card,sepa_bank_transfer&walletAddress=${account.publicKey}&colorCode=%23${colorCode}`
}

interface LumenDepositOptionsProps {
  account: Account
  heading?: string
  onCloseDialog: () => void
}

function LumenDepositOptions(props: LumenDepositOptionsProps) {
  const { account } = props
  const [isLegalNoteOpen, setIsLegalNoteOpen] = React.useState(false)

  const closeLegalNote = React.useCallback(() => setIsLegalNoteOpen(false), [])
  const openLegalNote = React.useCallback(() => setIsLegalNoteOpen(true), [])

  const navigateToMoonPay = React.useCallback(() => {
    openLink(createMoonPayURLForAccount(account))
    props.onCloseDialog()
  }, [account, props])

  return (
    <List style={{ margin: "16px auto", maxWidth: 600 }}>
      {props.heading ? <ListSubheader style={{ background: "none" }}>{props.heading}</ListSubheader> : null}
      <ListItem button onClick={openLegalNote}>
        <ListItemText
          primary="MoonPay"
          secondary="Buy Stellar Lumens instantly using your debit/credit card or Apple Pay"
        />
        <ListItemIcon style={{ minWidth: 24, marginLeft: 12 }}>
          <OpenInNewIcon />
        </ListItemIcon>
      </ListItem>
      <LegalConfirmation
        message={
          <>
            You will be redirected to moonpay.io, a third-party service. The depositing process is operated by Moon Pay
            Ltd, not by Solar or SatoshiPay Ltd.
            <br />
            <br />
            Please contact the moonpay.io support for inquiries related to your deposit.
          </>
        }
        onClose={closeLegalNote}
        open={isLegalNoteOpen}
        onConfirm={navigateToMoonPay}
      />
    </List>
  )
}

export default React.memo(LumenDepositOptions)

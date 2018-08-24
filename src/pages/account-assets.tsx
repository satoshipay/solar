import React from "react"
import { History } from "history"
import { match } from "react-router"
import { observer } from "mobx-react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import indigo from "@material-ui/core/colors/indigo"
import { createPaymentDialog } from "../components/Dialog/index"
import AccountBottomNavigation from "../components/Account/AccountBottomNavigation"
import AccountDetails from "../components/Account/AccountDetails"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import BottomNavigationContainer from "../components/BottomNavigationContainer"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import AccountStore from "../stores/accounts"
import { openDialog } from "../stores/dialogs"

const AccountAssetsPage = (props: {
  accounts: typeof AccountStore
  history: History
  match: match<{ id: string }>
}) => {
  const { params } = props.match
  const account = props.accounts.find(someAccount => someAccount.id === params.id)
  if (!account) {
    throw new Error(`Wallet account not found. ID: ${params.id}`)
  }

  return (
    <BottomNavigationContainer navigation={<AccountBottomNavigation account={account} />}>
      <Section top backgroundColor={indigo[500]}>
        <AccountHeaderCard account={account} history={props.history} style={{ color: "white" }} />
      </Section>
      <Section>Assets go here</Section>
    </BottomNavigationContainer>
  )
}

export default observer(AccountAssetsPage)

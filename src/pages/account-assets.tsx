import React from "react"
import { History } from "history"
import { match } from "react-router"
import { observer } from "mobx-react"
import indigo from "@material-ui/core/colors/indigo"
import AccountBottomNavigation from "../components/Account/AccountBottomNavigation"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import TrustlineList from "../components/Account/TrustlineList"
import BottomNavigationContainer from "../components/BottomNavigationContainer"
import { createAddTrustlineDialog, createRemoveTrustlineDialog } from "../components/Dialog"
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
      <Section>
        <Box padding="16px 8px">
          <TrustlineList
            publicKey={account.publicKey}
            testnet={account.testnet}
            onAddTrustline={() => openDialog(createAddTrustlineDialog(account))}
            onRemoveTrustline={asset => openDialog(createRemoveTrustlineDialog(account, asset))}
          />
        </Box>
      </Section>
    </BottomNavigationContainer>
  )
}

export default observer(AccountAssetsPage)

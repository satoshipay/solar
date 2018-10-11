import React from "react"
import { History } from "history"
import { match } from "react-router"
import { observer } from "mobx-react"
import AccountBottomNavigation from "../components/Account/AccountBottomNavigation"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import TrustlineList from "../components/Account/TrustlineList"
import BottomNavigationContainer from "../components/BottomNavigationContainer"
import { createCustomTrustlineDialog, createRemoveTrustlineDialog } from "../components/Dialog"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import AccountStore from "../stores/accounts"
import { openDialog } from "../stores/dialogs"
import { brandColor } from "../theme"

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
      <Section top backgroundColor={brandColor}>
        <AccountHeaderCard account={account} history={props.history} style={{ color: "white" }} />
      </Section>
      <Section>
        <Box padding="16px 8px">
          <TrustlineList
            account={account}
            onAddCustomTrustline={() => openDialog(createCustomTrustlineDialog(account))}
            onRemoveTrustline={asset => openDialog(createRemoveTrustlineDialog(account, asset))}
          />
        </Box>
      </Section>
    </BottomNavigationContainer>
  )
}

export default observer(AccountAssetsPage)

import { History } from "history"
import { observer } from "mobx-react"
import React from "react"
import { match } from "react-router"
import { Asset } from "stellar-sdk"
import AccountBottomNavigation from "../components/Account/AccountBottomNavigation"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import TrustlineList from "../components/Account/TrustlineList"
import BottomNavigationContainer from "../components/BottomNavigationContainer"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import { DialogsConsumer } from "../context/dialogs"
import { DialogBlueprint, DialogType } from "../context/dialogTypes"
import AccountStore, { Account } from "../stores/accounts"

function createCustomTrustlineDialog(account: Account): DialogBlueprint {
  return {
    type: DialogType.CustomTrustline,
    props: {
      account
    }
  }
}

function createRemoveTrustlineDialog(account: Account, asset: Asset): DialogBlueprint {
  return {
    type: DialogType.RemoveTrustline,
    props: {
      account,
      asset
    }
  }
}

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
      <Section top brandColored>
        <AccountHeaderCard account={account} history={props.history} style={{ color: "white" }} />
      </Section>
      <Section>
        <Box padding="16px 8px">
          <DialogsConsumer>
            {({ openDialog }) => (
              <TrustlineList
                account={account}
                onAddCustomTrustline={() => openDialog(createCustomTrustlineDialog(account))}
                onRemoveTrustline={asset => openDialog(createRemoveTrustlineDialog(account, asset))}
              />
            )}
          </DialogsConsumer>
        </Box>
      </Section>
    </BottomNavigationContainer>
  )
}

export default observer(AccountAssetsPage)

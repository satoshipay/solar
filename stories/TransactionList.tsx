import React from "react"
import { action } from "@storybook/addon-actions"
import { storiesOf } from "@storybook/react"
import { Account } from "../src/App/context/accounts"
import TransactionList from "../src/Account/components/TransactionList"
import { TransactionHistory } from "../src/Generic/hooks/_caches"
import { useLiveRecentTransactions } from "../src/Generic/hooks/stellar-subscriptions"

const account: Account = {
  id: "1",
  name: "Test account",
  publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
  requiresPassword: false,
  testnet: true,
  getPrivateKey() {
    throw Error("Just a mock.")
  },
  signTransaction() {
    throw Error("Just a mock.")
  }
}

function SampleTransactions(props: { children: (history: TransactionHistory) => React.ReactElement<any> }) {
  const history = useLiveRecentTransactions(account.publicKey, account.testnet)
  return props.children(history)
}

storiesOf("TransactionList", module).add("Recent transactions", () => (
  <SampleTransactions>
    {history => (
      <TransactionList
        account={account}
        onFetchMoreTransactions={action("load more transactions")}
        testnet
        title="Recent transactions"
        transactions={history.transactions}
      />
    )}
  </SampleTransactions>
))

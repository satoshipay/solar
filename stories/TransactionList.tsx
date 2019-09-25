import React from "react"
import { Transaction } from "stellar-sdk"
import { storiesOf } from "@storybook/react"
import { Account } from "../src/context/accounts"
import TransactionList from "../src/components/Account/TransactionList"
import { useLiveRecentTransactions } from "../src/hooks/stellar-subscriptions"

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

function SampleTransactions(props: { children: (transactions: Transaction[]) => React.ReactElement<any> }) {
  const { transactions } = useLiveRecentTransactions(account.publicKey, account.testnet)
  return props.children(transactions)
}

storiesOf("TransactionList", module).add("Recent transactions", () => (
  <SampleTransactions>
    {transactions => (
      <TransactionList account={account} testnet title="Recent transactions" transactions={transactions} />
    )}
  </SampleTransactions>
))

import React from "react"
import { Transaction } from "stellar-sdk"
import { storiesOf } from "@storybook/react"
import { Account } from "../src/context/accounts"
import TransactionList from "../src/components/Account/TransactionList"
import { useRecentTransactions } from "../src/hooks"

const account: Account = {
  id: "1",
  getPrivateKey() {
    throw Error("Nope.")
  },
  name: "Test account",
  publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
  requiresPassword: false,
  testnet: true
}

function SampleTransactions(props: { children: (transactions: Transaction[]) => React.ReactElement<any> }) {
  const { transactions } = useRecentTransactions(account.publicKey, account.testnet)
  return props.children(transactions)
}

storiesOf("TransactionList", module).add("Recent transactions", () => (
  <SampleTransactions>
    {transactions => (
      <TransactionList account={account} testnet title="Recent transactions" transactions={transactions} />
    )}
  </SampleTransactions>
))

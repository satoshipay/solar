import React from "react"
import { Transaction } from "stellar-sdk"
import { storiesOf } from "@storybook/react"
import TransactionList from "../src/components/Account/TransactionList"
import { useRecentTransactions } from "../src/hooks"

function SampleTransactions(props: { children: (transactions: Transaction[]) => React.ReactElement<any> }) {
  const { transactions } = useRecentTransactions("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W", true)
  return props.children(transactions)
}

storiesOf("TransactionList", module).add("Recent transactions", () => (
  <SampleTransactions>
    {transactions => (
      <TransactionList
        accountPublicKey="GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W"
        testnet
        title="Recent transactions"
        transactions={transactions}
      />
    )}
  </SampleTransactions>
))

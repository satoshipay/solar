import React from "react"
import { storiesOf } from "@storybook/react"
import { Transactions } from "../src/components/Subscribers"
import TransactionList from "../src/components/TransactionList"

storiesOf("TransactionList", module).add("Recent transactions", () => (
  <Transactions publicKey="GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W" testnet>
    {({ transactions }) => (
      <TransactionList
        accountPublicKey="GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W"
        testnet
        title="Recent transactions"
        transactions={transactions}
      />
    )}
  </Transactions>
))

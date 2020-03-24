import React from "react"
import { storiesOf } from "@storybook/react"
import AccountSelectionList from "../components/AccountSelectionList"
import { Account } from "~App/contexts/accounts"

const accounts: Account[] = [
  {
    id: "testid1",
    name: "My Testnet Account #1",
    publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
    requiresPassword: false,
    testnet: true,
    getPrivateKey: () => Promise.reject(Error("Just a mock.")),
    signTransaction: () => Promise.reject(Error("Just a mock."))
  },
  {
    id: "testid2",
    name: "My Testnet Account #2",
    publicKey: "GDNVDG37WMKPEIXSJRBAQAVPO5WGOPKZRZZBPLWXULSX6NQNLNQP6CFF",
    requiresPassword: false,
    testnet: true,
    getPrivateKey: () => Promise.reject(Error("Just a mock.")),
    signTransaction: () => Promise.reject(Error("Just a mock."))
  }
]

storiesOf("AccountSelection", module)
  .add("AccountSelectionList", () => <AccountSelectionList testnet={true} accounts={accounts} />)
  .add("AccountSelectionList disabled", () => (
    <AccountSelectionList disabled={true} testnet={true} accounts={accounts} />
  ))

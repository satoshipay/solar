import React from "react"
import { storiesOf } from "@storybook/react"
import AccountBalances from "../src/Account/components/AccountBalances"

storiesOf("Balance", module)
  .add("AccountBalance activated", () => (
    <div>
      Current balance: <AccountBalances publicKey="GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W" testnet />
    </div>
  ))
  .add("AccountBalance unactivated", () => (
    <div>
      Current balance: <AccountBalances publicKey="GD52DFJ57XWSBCN3MZQ4Z2TO4TCVVP2UXVWCBSTCKDUYXVPGMSVKS4M5" testnet />
    </div>
  ))

import React from "react"
import { Asset } from "stellar-sdk"
import { WithdrawalSuccessResponse } from "@satoshipay/stellar-sep-6"
import { action } from "@storybook/addon-actions"
import { storiesOf } from "@storybook/react"
import WithdrawalTransactionForm from "../src/components/Withdrawal/WithdrawalTransactionForm"
import AnchorWithdrawalInitForm from "../src/components/Withdrawal/WithdrawalRequestForm"
import WithdrawalKYCRedirect from "../src/components/Withdrawal/WithdrawalKYCRedirect"
import WithdrawalKYCStatus from "../src/components/Withdrawal/WithdrawalKYCStatus"
import { Account } from "../src/context/accounts"
import { RefStateObject } from "../src/hooks"

const eurt = new Asset("EURT", "GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S")

const account: Account = {
  id: "1",
  name: "Mainnet account",
  publicKey: "GDOOMATUOJPLIQMQ4WWXBEWR5UMKJW65CFKJJW3LV7XZYIEQHZPDQCBI",
  requiresPassword: false,
  testnet: false,
  getPrivateKey() {
    throw Error("Just a mock.")
  },
  signTransaction() {
    throw Error("Just a mock.")
  }
}

const actionsRef: RefStateObject = {
  element: null,
  update: () => undefined
}

const withdrawalSuccessResponse: WithdrawalSuccessResponse = {
  account_id: "",
  eta: 24 * 60 * 60,
  memo_type: "hash",
  memo: "6391dd190f15f7d1665ba53c63842e368f485651a53d8d852ed442a446d1c69a",
  min_amount: 5,
  fee_fixed: 2.0
}

storiesOf("Withdrawal", module)
  .addDecorator(render => <div style={{ minWidth: "70vw", margin: "20px" }}>{render()}</div>)
  .add("Request", () => (
    <AnchorWithdrawalInitForm
      actionsRef={actionsRef}
      assets={[eurt]}
      onCancel={action("Clicked cancel")}
      onSubmit={action("Clicked submit")}
      testnet={false}
    />
  ))
  .add("Finish", () => (
    <WithdrawalTransactionForm
      account={account}
      actionsRef={actionsRef}
      asset={eurt}
      anchorResponse={withdrawalSuccessResponse}
      onCancel={action("Clicked cancel")}
      onSubmit={action("Clicked submit")}
    />
  ))
  .add("Interactive KYC", () => (
    <WithdrawalKYCRedirect
      meta={{
        interactive_deposit: false,
        type: "interactive_customer_info_needed",
        url: "https://google.com/"
      }}
      onCancel={action("clicked cancel")}
    />
  ))
  .add("KYC pending", () => (
    <WithdrawalKYCStatus
      meta={{
        eta: 36 * 60 * 60,
        more_info_url: "https://google.com/",
        status: "pending",
        type: "customer_info_status"
      }}
      onCancel={action("clicked cancel")}
    />
  ))
  .add("KYC denied", () => (
    <WithdrawalKYCStatus
      meta={{
        more_info_url: "https://google.com/",
        status: "denied",
        type: "customer_info_status"
      }}
      onCancel={action("clicked cancel")}
    />
  ))

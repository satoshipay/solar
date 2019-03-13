import React from "react"
import { Asset } from "stellar-sdk"
import { WithdrawalRequestKYC, WithdrawalRequestSuccess } from "@satoshipay/sep-6"
import { action } from "@storybook/addon-actions"
import { storiesOf } from "@storybook/react"
import AnchorWithdrawalFinishForm from "../src/components/Payment/AnchorWithdrawalFinishForm"
import AnchorWithdrawalInitForm from "../src/components/Payment/AnchorWithdrawalInitForm"
import AnchorWithdrawalKYCForm from "../src/components/Payment/AnchorWithdrawalKYCForm"

const eurt = new Asset("EURT", "GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S")

const withdrawalSuccessResponse: WithdrawalRequestSuccess = {
  type: "success",
  data: {
    account_id: "",
    eta: 24 * 60 * 60,
    memo_type: "hash",
    memo: "6391dd190f15f7d1665ba53c63842e368f485651a53d8d852ed442a446d1c69a",
    max_amount: 5000,
    fee_fixed: 2.0
  }
}

const withdrawalInteractiveKYCResponse: WithdrawalRequestKYC = {
  type: "kyc",
  data: {
    interactive_deposit: false,
    type: "interactive_customer_info_needed",
    url: "https://google.com/"
  }
}

const withdrawalKYCPendingResponse: WithdrawalRequestKYC = {
  type: "kyc",
  data: {
    eta: 36 * 60 * 60,
    more_info_url: "https://google.com/",
    status: "pending",
    type: "customer_info_status"
  }
}

const withdrawalKYCDeniedResponse: WithdrawalRequestKYC = {
  type: "kyc",
  data: {
    more_info_url: "https://google.com/",
    status: "denied",
    type: "customer_info_status"
  }
}

storiesOf("Withdrawal", module)
  .addDecorator(render => <div style={{ minWidth: "70vw", margin: "20px" }}>{render()}</div>)
  .add("Request", () => (
    <AnchorWithdrawalInitForm
      assets={[eurt]}
      onCancel={action("clicked cancel")}
      onSubmit={action("clicked submit")}
      testnet={false}
    />
  ))
  .add("Finish", () => (
    <AnchorWithdrawalFinishForm
      anchorResponse={withdrawalSuccessResponse}
      onCancel={action("cancel")}
      onSubmit={action("submit")}
      testnet={false}
    />
  ))
  .add("Interactive KYC", () => (
    <AnchorWithdrawalKYCForm anchorResponse={withdrawalInteractiveKYCResponse} onCancel={action("clicked cancel")} />
  ))
  .add("KYC pending", () => (
    <AnchorWithdrawalKYCForm anchorResponse={withdrawalKYCPendingResponse} onCancel={action("clicked cancel")} />
  ))
  .add("KYC denied", () => (
    <AnchorWithdrawalKYCForm anchorResponse={withdrawalKYCDeniedResponse} onCancel={action("clicked cancel")} />
  ))

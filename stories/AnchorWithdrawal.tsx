import React from "react"
import { Asset } from "stellar-sdk"
import { WithdrawalRequestKYC, WithdrawalRequestSuccess } from "@satoshipay/sep-6"
import { storiesOf } from "@storybook/react"
import AnchorWithdrawalFinishForm from "../src/components/Payment/AnchorWithdrawalFinishForm"
import AnchorWithdrawalInitForm from "../src/components/Payment/AnchorWithdrawalInitForm"

const doNothing = () => undefined
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

storiesOf("Withdrawal", module)
  .addDecorator(render => <div style={{ minWidth: "70vw", margin: "20px" }}>{render()}</div>)
  .add("Request", () => (
    <AnchorWithdrawalInitForm assets={[eurt]} onCancel={doNothing} onSubmit={doNothing} testnet={false} />
  ))
  .add("Finish - No KYC", () => (
    <AnchorWithdrawalFinishForm
      anchorResponse={withdrawalSuccessResponse}
      onCancel={doNothing}
      onSubmit={doNothing}
      testnet={false}
    />
  ))
  .add("Finish - Interactive KYC", () => (
    <AnchorWithdrawalFinishForm
      anchorResponse={withdrawalInteractiveKYCResponse}
      onCancel={doNothing}
      onSubmit={doNothing}
      testnet={false}
    />
  ))

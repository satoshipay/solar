import BigNumber from "big.js"
import React from "react"
import { Asset } from "stellar-sdk"
import {
  AssetTransferInfo,
  KYCResponseType,
  TransferResultType,
  TransferServer,
  TransferStatus,
  Withdrawal,
  WithdrawalSuccessResponse,
  TransferTransaction
} from "@satoshipay/stellar-transfer"
import { action } from "@storybook/addon-actions"
import { storiesOf } from "@storybook/react"
import { DesktopTwoColumns } from "../components/Sidebar"
import { TransferState } from "../util/statemachine"
import { useWithdrawalState } from "../hooks/useWithdrawalState"
import { TransferContent, TransferSidebar } from "../components/TransferContent"
import WithdrawalProvider from "../components/WithdrawalProvider"
import { Account } from "../../App/context/accounts"

const eurt = new Asset("EURT", "GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S")
const demoAssets = [eurt]

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

const transferServer: TransferServer = {
  domain: "example.com",
  options: {}
} as any

const assetTransferInfos: AssetTransferInfo[] = [
  {
    asset: eurt,
    deposit: {
      authentication_required: true,
      enabled: true
    },
    transferServer,
    withdraw: {
      authentication_required: true,
      enabled: true,
      fee_fixed: 0.5,
      fee_percent: 1
    }
  }
]

const demoTransaction: TransferTransaction = {
  amount_fee: "0.0",
  amount_in: "0.0",
  amount_out: "0.0",
  completed_at: null,
  id: "123",
  kind: "withdrawal" as const,
  from: "",
  more_info_url: "https://example.com/foobar",
  refunded: false,
  started_at: new Date().toISOString(),
  status: TransferStatus.incomplete,
  stellar_transaction_id: "",
  to: "",
  withdraw_anchor_account: "",
  withdraw_memo: "",
  withdraw_memo_type: "none"
}

const withdrawal = Withdrawal(transferServer, eurt, {})

const withdrawalSuccessResponse: WithdrawalSuccessResponse = {
  account_id: "GDOOMATUOJPLIQMQ4WWXBEWR5UMKJW65CFKJJW3LV7XZYIEQHZPDQCBI",
  eta: 24 * 60 * 60,
  memo_type: "hash",
  memo: "6391dd190f15f7d1665ba53c63842e368f485651a53d8d852ed442a446d1c69a",
  min_amount: 5,
  fee_fixed: 2.0
}

function WithdrawalDemoState(props: { state: TransferState }) {
  const { actions } = useWithdrawalState(account, action("close dialog"))
  return (
    <WithdrawalProvider account={account} actions={actions} state={props.state}>
      <div style={{ minWidth: "70vw", margin: "20px" }}>
        <DesktopTwoColumns>
          <TransferContent
            account={account}
            assetTransferInfos={assetTransferInfos}
            onClose={action("close dialog")}
            sendTransaction={action("send transaction") as any}
            transferableAssets={demoAssets}
            trustedAssets={demoAssets}
            type="withdrawal"
            state={props.state}
          />
          <TransferSidebar state={props.state} type="withdrawal" />
        </DesktopTwoColumns>
      </div>
    </WithdrawalProvider>
  )
}

storiesOf("Withdrawal", module)
  .add("Initial", () => (
    <WithdrawalDemoState
      state={
        {
          step: "initial",
          formValues: {}
        } as const
      }
    />
  ))
  .add("Enter details", () => (
    <WithdrawalDemoState
      state={
        {
          step: "enter-values",
          asset: eurt,
          formValues: {},
          method: "",
          transferServer
        } as const
      }
    />
  ))
  // .add("Authentication", () => (
  //   <WithdrawalDemoState state={{
  //     step: "auth-pending",
  //     authChallenge,
  //     webauth,
  //     withdrawal
  //   } as const} />
  // ))
  .add("Interactive KYC required", () => (
    <WithdrawalDemoState
      state={
        {
          step: "kyc-pending",
          deposit: undefined,
          response: {
            data: {
              status: "pending",
              type: "customer_info_status"
            },
            subtype: KYCResponseType.interactive,
            type: TransferResultType.kyc
          },
          withdrawal
        } as const
      }
    />
  ))
  .add("Interactive KYC pending", () => (
    <WithdrawalDemoState
      state={
        {
          step: "kyc-pending",
          deposit: undefined,
          didRedirect: true,
          response: {
            data: {
              status: "pending",
              type: "customer_info_status"
            },
            subtype: KYCResponseType.interactive,
            type: TransferResultType.kyc
          },
          transfer: demoTransaction,
          withdrawal
        } as const
      }
    />
  ))
  .add("KYC denied", () => (
    <WithdrawalDemoState
      state={
        {
          step: "kyc-pending",
          deposit: undefined,
          didRedirect: true,
          response: {
            data: {
              status: "pending",
              type: "customer_info_status"
            },
            subtype: KYCResponseType.interactive,
            type: TransferResultType.kyc
          },
          transfer: {
            ...demoTransaction,
            message: "We could not verify your identity.",
            more_info_url: "https://google.com/",
            status: TransferStatus.error
          },
          withdrawal
        } as const
      }
    />
  ))
  .add("Transaction details", () => (
    <WithdrawalDemoState
      state={
        {
          step: "enter-tx-details",
          deposit: undefined,
          response: {
            data: withdrawalSuccessResponse,
            type: TransferResultType.ok
          },
          withdrawal
        } as const
      }
    />
  ))
  .add("Success", () => (
    <WithdrawalDemoState
      state={
        {
          step: "completed",
          amount: BigNumber(12),
          deposit: undefined,
          response: {
            data: withdrawalSuccessResponse,
            type: TransferResultType.ok
          },
          withdrawal
        } as const
      }
    />
  ))

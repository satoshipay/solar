import { AssetTransferInfo } from "@satoshipay/stellar-transfer"
import Typography from "@material-ui/core/Typography"
import React from "react"
import { Asset, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import ViewLoading from "../ViewLoading"
import WithdrawalAuthentication from "./WithdrawalAuthentication"
import WithdrawalDetailsForm from "./WithdrawalDetailsForm"
import WithdrawalInitial from "./WithdrawalInitial"
import WithdrawalKYCDenied from "./WithdrawalKYCDenied"
import WithdrawalKYCPending from "./WithdrawalKYCPending"
import WithdrawalSuccess from "./WithdrawalSuccess"
import WithdrawalTransactionDetails from "./WithdrawalTransactionDetails"
import { WithdrawalState } from "./statemachine"

function DesktopTwoColumns(props: { children: React.ReactNode[] }) {
  const isSmallScreen = useIsMobile()

  if (isSmallScreen) {
    return <VerticalLayout>{props.children[0]}</VerticalLayout>
  }

  return (
    <HorizontalLayout height="100%">
      <VerticalLayout grow minWidth={300} maxWidth={400} overflowY="auto" shrink={0} width="50%">
        <React.Suspense fallback={<ViewLoading />}>{props.children[0]}</React.Suspense>
      </VerticalLayout>
      <VerticalLayout
        grow
        height="100%"
        margin="0 0 0 5%"
        padding="0 1vw 0 5%"
        shrink
        style={{ borderLeft: "1px solid rgba(0, 0, 0, 0.25)" }}
      >
        {props.children[1]}
      </VerticalLayout>
    </HorizontalLayout>
  )
}

function Paragraph(props: { children: React.ReactNode }) {
  return (
    <Typography color="textSecondary" style={{ marginBottom: 16 }} variant="body2">
      {props.children}
    </Typography>
  )
}

interface SummaryProps {
  children: React.ReactNode
  headline: React.ReactNode
}

function Summary(props: SummaryProps) {
  return (
    <>
      <Typography color="textSecondary" style={{ marginTop: 16, marginBottom: 16 }} variant="h6">
        {props.headline}
      </Typography>
      {props.children}
    </>
  )
}

interface WithdrawalContentProps {
  account: Account
  active?: boolean
  assetTransferInfos: AssetTransferInfo[]
  dialogActionsRef?: RefStateObject
  onClose: () => void
  sendTransaction: (transaction: Transaction) => Promise<any>
  state: WithdrawalState
  trustedAssets: Asset[]
  withdrawableAssets: Asset[]
}

const WithdrawalContent = React.memo(function WithdrawalContent(props: WithdrawalContentProps) {
  const { assetTransferInfos, state, trustedAssets, withdrawableAssets } = props

  if (state.step === "initial") {
    return (
      <DesktopTwoColumns>
        <WithdrawalInitial
          assetTransferInfos={assetTransferInfos}
          dialogActionsRef={props.dialogActionsRef}
          state={state}
          trustedAssets={trustedAssets}
          withdrawableAssets={withdrawableAssets}
        />
        <Summary headline="What to withdraw">
          <Paragraph>
            Withdraw assets in your account, like USD to your bank account or ETH to your Ethereum wallet.
          </Paragraph>
          <Paragraph>Solar acts as a client to the service offered by the asset issuer only.</Paragraph>
        </Summary>
      </DesktopTwoColumns>
    )
  } else if (state.step === "enter-values") {
    return (
      <DesktopTwoColumns>
        <WithdrawalDetailsForm
          active={props.active || false}
          assetTransferInfos={assetTransferInfos}
          dialogActionsRef={props.dialogActionsRef}
          state={state}
        />
        <Summary headline="Enter details">
          <Paragraph>Provide further details about your intended withdrawal.</Paragraph>
          <Paragraph>The information you have to enter depends on what the asset issuer requests.</Paragraph>
        </Summary>
      </DesktopTwoColumns>
    )
  } else if (state.step === "auth-pending") {
    return (
      <DesktopTwoColumns>
        <WithdrawalAuthentication
          account={props.account}
          assetTransferInfos={assetTransferInfos}
          authChallenge={"authChallenge" in state ? state.authChallenge : null}
          dialogActionsRef={props.dialogActionsRef}
          state={state}
        />
        <Summary headline="Authentication">
          The asset issuer requires you to log in to their service using your account.
        </Summary>
      </DesktopTwoColumns>
    )
  } else if (state.step === "kyc-pending") {
    return (
      <DesktopTwoColumns>
        <WithdrawalKYCPending state={state} />
        <Summary headline="Know Your Customer">
          <Paragraph>The withdrawal service will only work if you provide personal information about you.</Paragraph>
          <Paragraph>This usually happens for legal reasons.</Paragraph>
        </Summary>
      </DesktopTwoColumns>
    )
  } else if (state.step === "kyc-denied") {
    return (
      <DesktopTwoColumns>
        <WithdrawalKYCDenied state={state} />
        <Summary headline="Know Your Customer">
          <Paragraph>
            You have been rejected – the withdrawal is disabled for you. Please contact the asset issuer.
          </Paragraph>
        </Summary>
      </DesktopTwoColumns>
    )
  } else if (state.step === "enter-tx-details") {
    return (
      <DesktopTwoColumns>
        <WithdrawalTransactionDetails
          dialogActionsRef={props.dialogActionsRef}
          sendTransaction={props.sendTransaction}
          state={state}
        />
        <Summary headline="Almost done">
          <Paragraph>Check the form and provide an amount to withdraw if necessary.</Paragraph>
          <Paragraph>The withdrawal is almost ready.</Paragraph>
        </Summary>
      </DesktopTwoColumns>
    )
  } else if (state.step === "completed") {
    return (
      <DesktopTwoColumns>
        <WithdrawalSuccess onClose={props.onClose} state={state} />
        <Summary headline="Done">Your withdrawal has been accepted and will be processed by the asset issuer.</Summary>
      </DesktopTwoColumns>
    )
  } else {
    throw Error(`Reached unexpected state: ${(state as WithdrawalState).step}`)
  }
})

export default React.memo(WithdrawalContent)

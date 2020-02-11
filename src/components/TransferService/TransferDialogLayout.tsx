import React from "react"
import { Account } from "../../context/accounts"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
import ScrollableBalances from "../AccountAssets/ScrollableBalances"
import DialogBody from "../Dialog/DialogBody"
import TestnetBadge from "../Dialog/TestnetBadge"
import InlineLoader from "../InlineLoader"
import { VerticalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"

interface TitleProps {
  account: Account
  onNavigateBack: () => void
  type: "deposit" | "withdrawal"
}

const Title = React.memo(function Title(props: TitleProps) {
  return (
    <MainTitle
      title={
        <span>
          {props.type === "deposit" ? "Deposit funds" : "Withdraw funds"}{" "}
          {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
        </span>
      }
      onBack={props.onNavigateBack}
    />
  )
})

interface TransferDialogLayoutProps {
  account: Account
  children: React.ReactNode
  dialogActionsRef: RefStateObject | undefined
  onNavigateBack: () => void
  type: "deposit" | "withdrawal"
}

function TransferDialogLayout(props: TransferDialogLayoutProps) {
  const isSmallScreen = useIsMobile()
  return (
    <DialogBody
      top={
        <>
          <Title account={props.account} onNavigateBack={props.onNavigateBack} type={props.type} />
          <React.Suspense fallback={<InlineLoader />}>
            <ScrollableBalances account={props.account} compact />
          </React.Suspense>
        </>
      }
      actions={props.dialogActionsRef}
    >
      <VerticalLayout height="100%" padding={isSmallScreen ? "16px 0px" : "16px 8px"}>
        {props.children}
      </VerticalLayout>
    </DialogBody>
  )
}

export default React.memo(TransferDialogLayout)

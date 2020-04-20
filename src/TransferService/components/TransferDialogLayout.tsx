import React from "react"
import { useTranslation } from "react-i18next"
import { Account } from "~App/contexts/accounts"
import { useIsMobile, RefStateObject } from "~Generic/hooks/userinterface"
import ScrollableBalances from "~Assets/components/ScrollableBalances"
import DialogBody from "~Layout/components/DialogBody"
import TestnetBadge from "~Generic/components/TestnetBadge"
import InlineLoader from "~Generic/components/InlineLoader"
import { VerticalLayout } from "~Layout/components/Box"
import MainTitle from "~Generic/components/MainTitle"

interface TitleProps {
  account: Account
  onNavigateBack: () => void
  type: "deposit" | "withdrawal"
}

const Title = React.memo(function Title(props: TitleProps) {
  const { t } = useTranslation()
  return (
    <MainTitle
      title={
        <span>
          {props.type === "deposit" ? t("transfer-service.title.deposit") : t("transfer-service.title.withdrawal")}{" "}
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

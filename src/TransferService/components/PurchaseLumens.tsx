import React from "react"
import { useTranslation } from "react-i18next"
import LumenDepositOptions from "~LumenPurchase/components/LumenPurchaseOptions"
import { VerticalLayout } from "~Layout/components/Box"
import { DepositContext } from "./DepositProvider"
import { Paragraph, Summary } from "./Sidebar"

interface PurchaseLumensProps {
  onCloseDialog: () => void
}

function PurchaseLumens(props: PurchaseLumensProps) {
  const { account } = React.useContext(DepositContext)

  return (
    <VerticalLayout alignItems="center" textAlign="center">
      <LumenDepositOptions account={account} onCloseDialog={props.onCloseDialog} />
    </VerticalLayout>
  )
}

const Sidebar = () => {
  const { t } = useTranslation()
  return (
    <Summary headline={t("transfer-service.purchase-lumens.sidebar.headline")}>
      <Paragraph>{t("transfer-service.purchase-lumens.sidebar.info.1")}</Paragraph>
      <Paragraph>{t("transfer-service.purchase-lumens.sidebar.info.2")}</Paragraph>
    </Summary>
  )
}
const PurchaseLumensView = Object.assign(React.memo(PurchaseLumens), { Sidebar })

export default PurchaseLumensView

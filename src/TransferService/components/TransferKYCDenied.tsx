import React from "react"
import { useTranslation } from "react-i18next"
import { CustomError } from "~Generic/lib/errors"
import { TransferStates } from "../util/statemachine"
import { Paragraph, Summary } from "./Sidebar"

interface Props {
  state: TransferStates.KYCDenied
}

function WithdrawalKYCDenied(props: Props): never {
  const { response } = props.state
  const { transferServer } = props.state.deposit! || props.state.withdrawal!

  throw CustomError(
    "KycDeniedError",
    `${transferServer.domain} has rejected the information about your person that you supplied. ` +
      `See ${response.more_info_url} for more details.`,
    { domain: transferServer.domain, url: response.more_info_url || "" }
  )
}

const Sidebar = () => {
  const { t } = useTranslation()
  return (
    <Summary headline={t("transfer-service.kyc-denied.sidebar.headline")}>
      <Paragraph>{t("transfer-service.kyc-denied.sidebar.info")}</Paragraph>
    </Summary>
  )
}

const KYCDeniedView = Object.assign(React.memo(WithdrawalKYCDenied), { Sidebar })

export default KYCDeniedView

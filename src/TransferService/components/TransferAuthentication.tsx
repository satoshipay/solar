import React from "react"
import { useTranslation } from "react-i18next"
import { Transaction } from "stellar-sdk"
import { AssetTransferInfo } from "@satoshipay/stellar-transfer"
import { Account } from "~App/contexts/accounts"
import { RefStateObject } from "~Generic/hooks/userinterface"
import { useLoadingState } from "~Generic/hooks/util"
import { isWrongPasswordError, CustomError } from "~Generic/lib/errors"
import { VerticalLayout } from "~Layout/components/Box"
import ReviewForm from "~TransactionReview/components/ReviewForm"
import { TransferState } from "../util/statemachine"
import { DepositContext } from "./DepositProvider"
import { Paragraph, Summary } from "./Sidebar"
import { WithdrawalContext } from "./WithdrawalProvider"
import { DepositActions } from "../hooks/useDepositState"
import { WithdrawalActions } from "../hooks/useWithdrawalState"

const doNothing = () => undefined

interface WithdrawalAuthenticationProps {
  account: Account
  assetTransferInfos: AssetTransferInfo[]
  authChallenge: Transaction | null
  dialogActionsRef: RefStateObject | undefined
  state: TransferState
  type: "deposit" | "withdrawal"
}

function WithdrawalAuthentication(props: WithdrawalAuthenticationProps) {
  const { actions, state } =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    props.type === "deposit" ? React.useContext(DepositContext) : React.useContext(WithdrawalContext)
  const [passwordError, setPasswordError] = React.useState<Error>()
  const [submission, handleSubmission] = useLoadingState({ throwOnError: true })

  const submit = React.useCallback(
    (options: { password: string | null }) =>
      handleSubmission(async () => {
        if (state.step !== "auth-pending") {
          throw CustomError("UnexpectedStateError", `Encountered unexpected state: ${state.step}`, {
            state: state.step
          })
        }
        try {
          return await (actions.performWebAuth as DepositActions["performWebAuth"] &
            WithdrawalActions["performWebAuth"])(
            state.deposit as any,
            state.withdrawal as any,
            state.webauth,
            props.authChallenge!,
            options.password
          )
        } catch (error) {
          if (isWrongPasswordError(error)) {
            setPasswordError(error)
          } else {
            throw error
          }
        }
      }),
    [actions.performWebAuth, handleSubmission, props.authChallenge, state]
  )

  if (!props.authChallenge) {
    return null
  }

  return (
    <VerticalLayout alignItems="stretch" margin="0 auto" maxWidth={500} width="100%">
      <ReviewForm
        account={props.account}
        actionsRef={props.dialogActionsRef}
        loading={submission.type === "pending"}
        passwordError={passwordError}
        onClose={actions.navigateBack}
        onConfirm={state.step === "auth-pending" ? submit : doNothing}
        transaction={props.authChallenge}
      />
    </VerticalLayout>
  )
}

const Sidebar = () => {
  const { t } = useTranslation()
  return (
    <Summary headline={t("transfer-service.authentication.sidebar.headline")}>
      <Paragraph>{t("transfer-service.authentication.sidebar.info.1")}</Paragraph>
      <Paragraph>{t("transfer-service.authentication.sidebar.info.2")}</Paragraph>
    </Summary>
  )
}

const AuthenticationView = Object.assign(React.memo(WithdrawalAuthentication), { Sidebar })

export default AuthenticationView

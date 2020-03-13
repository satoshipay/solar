import React from "react"
import { Transaction } from "stellar-sdk"
import { AssetTransferInfo } from "@satoshipay/stellar-transfer"
import { Account } from "../../context/accounts"
import { RefStateObject } from "../../hooks/userinterface"
import { useLoadingState } from "../../hooks/util"
import { isWrongPasswordError } from "../../lib/errors"
import { VerticalLayout } from "../Layout/Box"
import ReviewForm from "../TransactionReview/ReviewForm"
import { TransferState } from "./statemachine"
import { DepositContext } from "./DepositProvider"
import { Paragraph, Summary } from "./Sidebar"
import { WithdrawalContext } from "./WithdrawalProvider"
import { DepositActions } from "./useDepositState"
import { WithdrawalActions } from "./useWithdrawalState"

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
          throw Error(`Encountered unexpected state: ${state.step}`)
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

const Sidebar = () => (
  <Summary headline="Authentication">
    <Paragraph>The asset issuer requires you to log in to their service using your account.</Paragraph>
    <Paragraph>An authentication transaction will be signed to prove ownership of that account.</Paragraph>
  </Summary>
)

const AuthenticationView = Object.assign(React.memo(WithdrawalAuthentication), { Sidebar })

export default AuthenticationView

import React from "react"
import Divider from "@material-ui/core/Divider"
import Typography from "@material-ui/core/Typography"
import { Transaction } from "stellar-sdk"
import { AssetTransferInfo } from "@satoshipay/stellar-transfer"
import { Account } from "../../context/accounts"
import { RefStateObject } from "../../hooks/userinterface"
import { useLoadingState } from "../../hooks/util"
import { isWrongPasswordError } from "../../lib/errors"
import { VerticalLayout } from "../Layout/Box"
import ReviewForm from "../TransactionReview/ReviewForm"
import { WithdrawalState } from "./statemachine"
import { WithdrawalContext } from "./WithdrawalProvider"

const doNothing = () => undefined

interface WithdrawalAuthenticationProps {
  account: Account
  assetTransferInfos: AssetTransferInfo[]
  authChallenge: Transaction | null
  dialogActionsRef: RefStateObject | undefined
  state: WithdrawalState
}

function WithdrawalAuthentication(props: WithdrawalAuthenticationProps) {
  const { actions, state } = React.useContext(WithdrawalContext)
  const [passwordError, setPasswordError] = React.useState<Error>()
  const [submission, handleSubmission] = useLoadingState({ throwOnError: true })

  const submit = React.useCallback(
    (options: { password: string | null }) =>
      handleSubmission(async () => {
        if (state.step !== "auth-pending") {
          throw Error(`Encountered unexpected state: ${state.step}`)
        }
        try {
          return await actions.performWebAuth(state.withdrawal, state.webauth, props.authChallenge!, options.password)
        } catch (error) {
          if (isWrongPasswordError(error)) {
            setPasswordError(error)
          } else {
            throw error
          }
        }
      }),
    [actions.performWebAuth, props.authChallenge, state]
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

export default React.memo(WithdrawalAuthentication)

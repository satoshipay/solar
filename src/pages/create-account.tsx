import { History } from "history"
import React from "react"
import { useContext } from "react"
import { withRouter, RouteComponentProps } from "react-router-dom"
import { Keypair } from "stellar-sdk"
import * as routes from "../routes"
import { Section } from "../components/Layout/Page"
import AccountCreationForm, { AccountCreationValues } from "../components/Form/CreateAccount"
import { Box } from "../components/Layout/Box"
import { AccountsContext } from "../context/accounts"
import { trackError } from "../context/notifications"

interface Props {
  history: History
  testnet: boolean
}

function CreateAccountPage(props: Props) {
  const { accounts, createAccount } = useContext(AccountsContext)

  const onCreateAccount = async (formValues: AccountCreationValues) => {
    try {
      const account = await createAccount({
        name: formValues.name,
        keypair: Keypair.fromSecret(formValues.privateKey),
        password: formValues.setPassword ? formValues.password : null,
        testnet: props.testnet
      })
      props.history.push(routes.account(account.id))
    } catch (error) {
      trackError(error)
    }
  }

  const onClose = () => {
    props.history.push(routes.allAccounts())
  }

  return (
    <Section top>
      <Box padding="16px 24px" style={{ position: "relative" }}>
        <AccountCreationForm
          accounts={accounts}
          onCancel={onClose}
          onSubmit={onCreateAccount}
          testnet={props.testnet}
        />
      </Box>
    </Section>
  )
}

export default withRouter<RouteComponentProps<any> & Props>(CreateAccountPage)

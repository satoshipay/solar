import { History } from "history"
import React from "react"
import { withRouter } from "react-router-dom"
import { Keypair } from "stellar-sdk"
import * as routes from "../routes"
import { Section } from "../components/Layout/Page"
import AccountCreationForm, { AccountCreationValues } from "../components/Form/CreateAccount"
import { Box } from "../components/Layout/Box"
import { addError } from "../context/notifications"
import { createAccount as createAccountInStore } from "../stores/accounts"

interface Props {
  testnet: boolean
}

class CreateAccountPage extends React.Component<Props & { history: History }> {
  createAccount = async (formValues: AccountCreationValues) => {
    try {
      const account = await createAccountInStore({
        name: formValues.name,
        keypair: Keypair.fromSecret(formValues.privateKey),
        password: formValues.setPassword ? formValues.password : null,
        testnet: this.props.testnet
      })
      this.props.history.push(routes.account(account.id))
    } catch (error) {
      addError(error)
    }
  }

  close = () => {
    this.props.history.push(routes.allAccounts())
  }

  render() {
    return (
      <Section top backgroundColor="white">
        <Box padding="16px 24px" style={{ position: "relative" }}>
          <AccountCreationForm onCancel={this.close} onSubmit={this.createAccount} testnet={this.props.testnet} />
        </Box>
      </Section>
    )
  }
}

const RoutedCreateAccountPage = withRouter<any>(CreateAccountPage)

// react-router wants functional components
const CreateAccountPageContainer = (props: Props) => <RoutedCreateAccountPage {...props} />

export default CreateAccountPageContainer

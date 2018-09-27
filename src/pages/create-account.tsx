import { History } from "history"
import React from "react"
import { withRouter } from "react-router-dom"
import { Keypair } from "stellar-sdk"
import Typography from "@material-ui/core/Typography"
import * as routes from "../routes"
import CloseButton from "../components/Dialog/CloseButton"
import { Section } from "../components/Layout/Page"
import AccountCreationForm, { AccountCreationValues } from "../components/Form/CreateAccount"
import { Box } from "../components/Layout/Box"
import { createAccount as createAccountInStore } from "../stores/accounts"
import { addError } from "../stores/notifications"

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
          <CloseButton onClick={this.close} />
          <Typography color="textSecondary" variant="headline" style={{ marginBottom: 28 }}>
            {this.props.testnet ? "Add Testnet Account" : "Add Account"}
          </Typography>
          <AccountCreationForm onSubmit={this.createAccount} />
        </Box>
      </Section>
    )
  }
}

const RoutedCreateAccountPage = withRouter<any>(CreateAccountPage)

// react-router wants functional components
const CreateAccountPageContainer = (props: Props) => <RoutedCreateAccountPage {...props} />

export default CreateAccountPageContainer

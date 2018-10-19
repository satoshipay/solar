import { History } from "history"
import React from "react"
import { withRouter, RouteComponentProps } from "react-router-dom"
import { Keypair } from "stellar-sdk"
import * as routes from "../routes"
import { Section } from "../components/Layout/Page"
import AccountCreationForm, { AccountCreationValues } from "../components/Form/CreateAccount"
import { Box } from "../components/Layout/Box"
import { AccountsConsumer, AccountsContext } from "../context/accounts"
import { addError } from "../context/notifications"

interface Props {
  history: History
  testnet: boolean
  createAccount: AccountsContext["createAccount"]
}

class CreateAccountPage extends React.Component<Props> {
  createAccount = async (formValues: AccountCreationValues) => {
    try {
      const account = await this.props.createAccount({
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
      <Section top>
        <Box padding="16px 24px" style={{ position: "relative" }}>
          <AccountCreationForm onCancel={this.close} onSubmit={this.createAccount} testnet={this.props.testnet} />
        </Box>
      </Section>
    )
  }
}

type ContainerProps = RouteComponentProps<any> & Pick<Props, "testnet">

const CreateAccountPageContainer = (props: ContainerProps) => {
  return (
    <AccountsConsumer>
      {({ createAccount }) => <CreateAccountPage {...props} createAccount={createAccount} />}
    </AccountsConsumer>
  )
}

export default withRouter<ContainerProps>(CreateAccountPageContainer)

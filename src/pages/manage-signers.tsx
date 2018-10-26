import { History } from "history"
import React from "react"
import { match } from "react-router"
import { Operation, Server, Transaction } from "stellar-sdk"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import ManageSignersForm, { SignerUpdate } from "../components/ManageSigners/ManageSignersForm"
import TransactionSender from "../components/TransactionSender"
import { Account, AccountsConsumer } from "../context/accounts"
import { addError } from "../context/notifications"
import { createTransaction } from "../lib/transaction"
import * as routes from "../routes"

interface Props {
  account: Account
  history: History
  horizon: Server
  match: match<{ id: string }>
  sendTransaction: (tx: Transaction) => void
}

interface State {
  transaction: Transaction | null
  txCreationPending: boolean
}

class ManageSignersPage extends React.Component<Props, State> {
  state: State = {
    transaction: null,
    txCreationPending: false
  }

  cancel = () => {
    const route = routes.account(this.props.account.id)
    this.props.history.push(route)
  }

  createTransaction = async (update: SignerUpdate) => {
    try {
      this.setState({ txCreationPending: true })

      const operations = [
        ...update.signersToAdd.map(signer =>
          Operation.setOptions({
            signer: { ed25519PublicKey: signer.public_key, weight: signer.weight }
          })
        ),
        ...update.signersToRemove.map(signer =>
          Operation.setOptions({
            signer: { ed25519PublicKey: signer.public_key, weight: 0 }
          })
        ),
        Operation.setOptions({
          lowThreshold: update.weightThreshold,
          medThreshold: update.weightThreshold,
          highThreshold: update.weightThreshold
        })
      ]

      const tx = await createTransaction(operations, {
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })
      this.props.sendTransaction(tx)
    } catch (error) {
      addError(error)
    } finally {
      this.setState({ txCreationPending: false })
    }
  }

  render() {
    return (
      <Section top brandColored>
        <Box padding="16px 24px" style={{ position: "relative" }}>
          <ManageSignersForm account={this.props.account} onCancel={this.cancel} onSubmit={this.createTransaction} />
        </Box>
      </Section>
    )
  }
}

const ManageSignersPageContainer = (props: Pick<Props, "history" | "match">) => {
  return (
    <AccountsConsumer>
      {({ accounts }) => {
        const { params } = props.match
        const account = accounts.find(someAccount => someAccount.id === params.id)

        if (!account) {
          throw new Error(`Wallet account not found. ID: ${params.id}`)
        }

        const closeAfterTimeout = () => {
          // Navigate automatically a second after successful submission
          setTimeout(() => {
            props.history.push(routes.account(account.id))
          }, 1000)
        }

        return (
          <TransactionSender account={account} onSubmissionCompleted={closeAfterTimeout}>
            {({ horizon, sendTransaction }) => (
              <ManageSignersPage {...props} account={account} horizon={horizon} sendTransaction={sendTransaction} />
            )}
          </TransactionSender>
        )
      }}
    </AccountsConsumer>
  )
}

export default ManageSignersPageContainer

import React from "react"
import { Keypair } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import ExportKeyDialog from "../components/AccountSettings/ExportKeyDialog"
import AccountCreationForm, { AccountCreationValues } from "../components/Form/CreateAccount"
import { AccountsContext, Account } from "../context/accounts"
import { trackError } from "../context/notifications"
import { useRouter } from "../hooks/userinterface"
import * as routes from "../routes"
import { FullscreenDialogTransition } from "../theme"

function CreateAccountPage(props: { testnet: boolean }) {
  const { accounts, createAccount } = React.useContext(AccountsContext)
  const [createdAccount, setCreatedAccount] = React.useState<Account | null>(null)
  const router = useRouter()

  const onCreateAccount = async (formValues: AccountCreationValues) => {
    try {
      const account = await createAccount({
        name: formValues.name,
        keypair: Keypair.fromSecret(formValues.privateKey),
        password: formValues.setPassword ? formValues.password : null,
        testnet: props.testnet
      })

      if (formValues.createNewKey && !props.testnet) {
        setCreatedAccount(account)
      } else {
        router.history.push(routes.account(account.id))
      }
    } catch (error) {
      trackError(error)
    }
  }

  const closeBackupDialog = () => {
    if (createdAccount) {
      router.history.push(routes.account(createdAccount.id))
    }
  }

  const onClose = () => router.history.push(routes.allAccounts())

  return (
    <>
      <AccountCreationForm accounts={accounts} onCancel={onClose} onSubmit={onCreateAccount} testnet={props.testnet} />
      <Dialog
        fullScreen
        open={createdAccount !== null}
        onClose={closeBackupDialog}
        TransitionComponent={FullscreenDialogTransition}
      >
        <ExportKeyDialog account={createdAccount!} onConfirm={closeBackupDialog} variant="initial-backup" />
      </Dialog>
    </>
  )
}

export default CreateAccountPage

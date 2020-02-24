import React from "react"
import AddIcon from "@material-ui/icons/Add"
import RestoreIcon from "@material-ui/icons/SettingsBackupRestore"
import { useRouter } from "../../hooks/userinterface"
import { matchesRoute } from "../../lib/routes"
import * as routes from "../../routes"
import MainSelectionButton from "../Form/MainSelectionButton"
import { VerticalLayout } from "../Layout/Box"
import Carousel from "../Layout/Carousel"
import AccountCreationOptions from "./AccountCreationSettings"
import { AccountCreation, AccountCreationErrors } from "./types"

interface InitialSelectionProps {
  onUpdateAccountCreation: (update: Partial<AccountCreation>) => void
  testnet: boolean
}

const InitialSelection = React.memo(
  React.forwardRef(function InitialSelection(props: InitialSelectionProps, ref: React.Ref<HTMLDivElement>) {
    const { onUpdateAccountCreation } = props
    const router = useRouter()

    const createAccount = React.useCallback(() => {
      onUpdateAccountCreation({ import: false })
      router.history.push(routes.createAccount(props.testnet))
    }, [onUpdateAccountCreation, props.testnet, router.history])

    const importAccount = React.useCallback(() => {
      onUpdateAccountCreation({ import: true })
      router.history.push(routes.importAccount(props.testnet))
    }, [onUpdateAccountCreation, props.testnet, router.history])

    return (
      <VerticalLayout ref={ref} alignItems="center" justifyContent="space-evenly" margin="48px 0 24px" padding="0 8px">
        <MainSelectionButton
          label="Create account"
          description="Create a new empty account"
          onClick={createAccount}
          style={{ marginBottom: 16 }}
          Icon={AddIcon}
        />
        <MainSelectionButton
          label="Import account"
          description="Restore account from backup"
          onClick={importAccount}
          style={{ marginBottom: 16 }}
          Icon={RestoreIcon}
        />
      </VerticalLayout>
    )
  })
)

interface NewAccountSetupProps {
  accountCreation: AccountCreation
  errors: AccountCreationErrors
  onUpdateAccountCreation: (update: Partial<AccountCreation>) => void
}

function NewAccountSetup(props: NewAccountSetupProps) {
  const router = useRouter()
  const testnet = Boolean(router.location.pathname.match(/\/testnet/))

  const isSelectionStep = matchesRoute(router.location.pathname, routes.newAccount(testnet), false)

  return (
    <Carousel current={isSelectionStep ? 0 : 1}>
      <InitialSelection onUpdateAccountCreation={props.onUpdateAccountCreation} testnet={testnet} />
      <AccountCreationOptions {...props} />
    </Carousel>
  )
}

export default React.memo(NewAccountSetup)

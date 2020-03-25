import React from "react"
import RestoreIcon from "@material-ui/icons/SettingsBackupRestore"
import WalletIcon from "@material-ui/icons/AccountBalanceWallet"
import { Account } from "~App/contexts/accounts"
import { useRouter } from "~Generic/hooks/userinterface"
import { matchesRoute } from "~Generic/lib/routes"
import * as routes from "~App/routes"
import ExportKeyDialog from "~AccountSettings/components/ExportKeyDialog"
import MainSelectionButton from "~Generic/components/MainSelectionButton"
import { VerticalLayout } from "~Layout/components/Box"
import Carousel from "~Layout/components/Carousel"
import NewAccountSettings from "./NewAccountSettings"
import { AccountCreation, AccountCreationErrors } from "../types/types"

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
      <VerticalLayout ref={ref} alignItems="center" margin="48px 0 24px" padding="0 8px">
        <VerticalLayout alignItems="stretch" margin="0 auto">
          <MainSelectionButton
            dense
            label="Create account"
            description="Create a new empty account"
            gutterBottom
            onClick={createAccount}
            variant="primary"
            Icon={WalletIcon}
          />
          <MainSelectionButton
            dense
            label="Import account"
            description="Restore account from backup"
            gutterBottom
            onClick={importAccount}
            Icon={RestoreIcon}
          />
        </VerticalLayout>
      </VerticalLayout>
    )
  })
)

interface AccountCreationOptionsProps {
  accountToBackup: Account | null
  accountCreation: AccountCreation
  errors: AccountCreationErrors
  onFinishBackup: () => void
  onUpdateAccountCreation: (update: Partial<AccountCreation>) => void
}

function AccountCreationOptions(props: AccountCreationOptionsProps) {
  const router = useRouter()
  const testnet = Boolean(router.location.pathname.match(/\/testnet/))

  const currentStep = matchesRoute(router.location.pathname, routes.newAccount(testnet), false)
    ? 0
    : !props.accountToBackup
    ? 1
    : 2

  return (
    <Carousel current={currentStep}>
      <InitialSelection onUpdateAccountCreation={props.onUpdateAccountCreation} testnet={testnet} />
      <NewAccountSettings {...props} />
      <ExportKeyDialog account={props.accountToBackup} onConfirm={props.onFinishBackup} variant="initial-backup" />
    </Carousel>
  )
}

export default React.memo(AccountCreationOptions)

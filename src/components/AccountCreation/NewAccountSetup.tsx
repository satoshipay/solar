import React from "react"
import AddIcon from "@material-ui/icons/Add"
import RestoreIcon from "@material-ui/icons/SettingsBackupRestore"
import { useRouter } from "../../hooks/userinterface"
import { matchesRoute } from "../../lib/routes"
import * as routes from "../../routes"
import MainSelectionButton from "../Form/MainSelectionButton"
import { HorizontalLayout } from "../Layout/Box"
import Carousel from "../Layout/Carousel"
import AccountCreationOptions from "./AccountCreationOptions"

interface InitialSelectionProps {
  testnet: boolean
}

const InitialSelection = React.memo(
  React.forwardRef(function InitialSelection(props: InitialSelectionProps, ref: React.Ref<HTMLDivElement>) {
    const router = useRouter()

    const navigateTo = React.useMemo(
      () => ({
        createAccount: () => router.history.push(routes.createAccount(props.testnet)),
        importAccount: () => router.history.push(routes.importAccount(props.testnet))
      }),
      [props.testnet, router.history]
    )

    return (
      <HorizontalLayout ref={ref} justifyContent="space-evenly" margin="48px 0 24px" padding="0 8px" wrap="wrap">
        <MainSelectionButton
          label="Create account"
          description="Create a new empty account"
          onClick={navigateTo.createAccount}
          style={{ marginBottom: 16 }}
          Icon={AddIcon}
        />
        <MainSelectionButton
          label="Import account"
          description="Restore account from backup"
          onClick={navigateTo.importAccount}
          style={{ marginBottom: 16 }}
          Icon={RestoreIcon}
        />
      </HorizontalLayout>
    )
  })
)

function NewAccountSetup() {
  const router = useRouter()
  const testnet = Boolean(router.location.pathname.match(/\/testnet/))

  const isSelectionStep = matchesRoute(router.location.pathname, routes.newAccount(testnet), false)

  return (
    <Carousel current={isSelectionStep ? 0 : 1}>
      <InitialSelection testnet={testnet} />
      <>
        {(() => {
          if (matchesRoute(router.location.pathname, routes.createAccount(testnet), false)) {
            return <AccountCreationOptions />
          } else if (matchesRoute(router.location.pathname, routes.importAccount(testnet), false)) {
            return <AccountCreationOptions import />
          } else if (matchesRoute(router.location.pathname, routes.newAccount(testnet), false)) {
            return null
          } else {
            throw Error(`On unknown route: ${router.location.pathname}`)
          }
        })()}
      </>
    </Carousel>
  )
}

export default React.memo(NewAccountSetup)

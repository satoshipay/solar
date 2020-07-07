import React from "react"
import { useTranslation } from "react-i18next"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import Typography from "@material-ui/core/Typography"
import { Box } from "~Layout/components/Box"
import { getConnectedWallets, requestHardwareAccount } from "~Platform/hardware-wallet"
import { AccountsContext } from "~App/contexts/accounts"
import { NotificationsContext } from "~App/contexts/notifications"
import { useRouter } from "~Generic/hooks/userinterface"
import * as routes from "../../App/routes"
import { CustomError } from "~Generic/lib/errors"

function HardwareWalletSelection() {
  const { accounts, createHardwareAccount } = React.useContext(AccountsContext)
  const { showError } = React.useContext(NotificationsContext)
  const router = useRouter()
  const { t } = useTranslation()

  const [connectedWallets, setConnectedWallets] = React.useState<HardwareWallet[]>([])
  getConnectedWallets().then(setConnectedWallets)

  const onSelectWallet = React.useCallback(
    async (walletID: string) => {
      const walletRelatedAccounts = accounts.filter(acc => acc.id.includes(walletID))
      const walletAccountsIDs = walletRelatedAccounts.map(wallAcc => Number(wallAcc.id.split("-")[2])).sort()

      let nextAccountID = walletAccountsIDs.length
      // check for missing account lower than the highest id
      for (let i = 0; i < walletAccountsIDs.length; i++) {
        if (walletAccountsIDs[i] !== i) {
          nextAccountID = i
        }
      }

      const newAccount = await requestHardwareAccount(walletID, nextAccountID)
      if (!newAccount) {
        showError(
          CustomError(
            "RequestHardwareAccountFailedError",
            "Could not retrieve new hardware account. Make sure you are still in the Stellar application of your wallet."
          )
        )
      }
      const accountInstance = await createHardwareAccount(newAccount)
      router.history.push(routes.account(accountInstance.id))
    },
    [accounts, createHardwareAccount, router.history, showError]
  )

  return (
    <Box padding="24px 16px">
      <List style={{ padding: "24px 16px" }}>
        {connectedWallets.map(wallet => (
          <ListItem key={wallet.id} button onClick={() => onSelectWallet(wallet.id)}>
            <ListItemText
              primary={wallet.deviceModel ? wallet.deviceModel : wallet.id}
              style={{ textAlign: "center" }}
            />
          </ListItem>
        ))}
      </List>
      <Typography align="center" color="textSecondary">
        {t("create-account.hardware-wallet-selection.header")}
      </Typography>
    </Box>
  )
}

export default HardwareWalletSelection

import React from "react"
import { useTranslation } from "react-i18next"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import Typography from "@material-ui/core/Typography"
import { useIsMobile } from "~Generic/hooks/userinterface"
import { Box } from "~Layout/components/Box"
import { getConnectedWallets } from "~Platform/hardware-wallet"
import { AccountCreation, AccountCreationErrors } from "../types/types"

interface HardwareWalletSelectionProps {
  errors: AccountCreationErrors
  onUpdateAccountCreation: (update: Partial<AccountCreation>) => void
}

function HardwareWalletSelection(props: HardwareWalletSelectionProps) {
  const { onUpdateAccountCreation } = props

  const [selectedWalletID, setSelectedWalletID] = React.useState<string>("")

  const isSmallScreen = useIsMobile()
  const { t } = useTranslation()

  const connectedWallets = getConnectedWallets()

  const onSelectWallet = React.useCallback(
    (walletID: string) => {
      setSelectedWalletID(walletID)
      onUpdateAccountCreation({ walletID })
    },
    [onUpdateAccountCreation]
  )

  return (
    <Box padding="24px 16px">
      <Typography color="textPrimary">{t("create-account.hardware-wallet-selection.header")}</Typography>
      <List style={{ padding: isSmallScreen ? 0 : "24px 16px" }}>
        {connectedWallets.map(wallet => (
          <ListItem
            key={wallet.id}
            button
            onClick={() => onSelectWallet(wallet.id)}
            selected={wallet.id === selectedWalletID}
          >
            <ListItemText primary={wallet.id} secondary={wallet.deviceModel} />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export default HardwareWalletSelection

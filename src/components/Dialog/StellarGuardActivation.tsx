import React from "react"
import Typography from "@material-ui/core/Typography"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import { useIsMobile } from "../../hooks"
import { Box, VerticalLayout, HorizontalLayout } from "../Layout/Box"
import { DialogActionsBox, ActionButton } from "./Generic"
import StellarGuardIcon from "../Icon/StellarGuard"
import { Transaction } from "stellar-base"
import AccountSelectionList from "../Account/AccountSelectionList"
import { Account, AccountsContext } from "../../context/accounts"
import TransactionSender from "../TransactionSender"
import { loadAccount } from "../../lib/account"
import { Server } from "stellar-sdk"
import { createCopyWithDifferentSourceAccount } from "../../lib/transaction"

interface Props {
  onClose: () => void
  transaction: Transaction
  testnet: boolean
  accounts: Account[]
  horizon: Server
  sendTransaction: (account: Account, transaction: Transaction) => void
}

export function StellarGuardActivationDialog(props: Props) {
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)
  const isSmallScreen = useIsMobile()

  const submit = async () => {
    if (selectedAccount) {
      const stellarAccount = await loadAccount(props.horizon, selectedAccount.publicKey)
      if (stellarAccount) {
        const modifiedTransaction = createCopyWithDifferentSourceAccount(props.transaction, stellarAccount)
        await props.sendTransaction(selectedAccount, modifiedTransaction)
        setTimeout(props.onClose, 2000)
      }
    }
  }

  const filteredAccounts = props.accounts.filter(account => account.testnet === props.testnet)

  return (
    <>
      <Box width="100%" maxWidth={900} padding={isSmallScreen ? "24px" : " 24px 32px"} margin="0 auto 32px">
        <HorizontalLayout>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Activate two-factor authentication
          </Typography>
          <StellarGuardIcon style={{ color: "blue" }} />
        </HorizontalLayout>
        <Typography variant="body1" style={{ marginTop: 8 }}>
          To add two-factor authentication to your account you need to add StellarGuard as co-signer to your account.
          <br />
          Don't worry, StellarGuard is a verified partner of ours.
        </Typography>
      </Box>
      <VerticalLayout justifyContent="center" alignItems="center">
        <Typography align="center" style={{ marginBottom: 12 }}>
          Select the account to which you want to add two-factor authentication:
        </Typography>
        <AccountSelectionList onChange={setSelectedAccount} accounts={filteredAccounts} testnet={props.testnet} />
      </VerticalLayout>
      <DialogActionsBox>
        <ActionButton icon={<CloseIcon />} onClick={props.onClose}>
          Cancel
        </ActionButton>
        <ActionButton
          autoFocus
          disabled={selectedAccount === null}
          icon={<CheckIcon />}
          onClick={submit}
          type="primary"
        >
          Activate StellarGuard
        </ActionButton>
      </DialogActionsBox>
    </>
  )
}

function StellarGuardActivationContainer(props: { testnet: boolean; transaction: Transaction; onClose: () => void }) {
  const accountsContext = React.useContext(AccountsContext)

  return (
    <TransactionSender testnet={props.testnet}>
      {txContext => <StellarGuardActivationDialog {...props} {...accountsContext} {...txContext} />}
    </TransactionSender>
  )
}

export default StellarGuardActivationContainer

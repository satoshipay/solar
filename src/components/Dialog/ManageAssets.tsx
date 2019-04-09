import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import AddIcon from "@material-ui/icons/Add"
import { Account, AccountsContext } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import TrustlineList from "../Account/TrustlineList"
import { Box, HorizontalLayout } from "../Layout/Box"
import ButtonIconLabel from "../ButtonIconLabel"
import ErrorBoundary from "../ErrorBoundary"
import TransactionSender from "../TransactionSender"
import BackButton from "./BackButton"
import CustomTrustlineDialog from "./CustomTrustline"
import RemoveTrustlineDialog from "./RemoveTrustline"

interface Props {
  account: Account
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function ManageAssets(props: Props) {
  const [isCustomTrustlineDialogOpen, setCustomTrustlineDialogOpen] = React.useState(false)
  const [removalDialogAsset, setRemovalDialogAsset] = React.useState<Asset | null>(null)
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

  const addAsset = async (asset: Asset, options: { limit?: string } = {}) => {
    try {
      const operations = [Operation.changeTrust({ asset, limit: options.limit })]
      const transaction = await createTransaction(operations, {
        accountData,
        horizon: props.horizon,
        walletAccount: props.account
      })
      props.sendTransaction(transaction)
    } catch (error) {
      trackError(error)
    }
  }

  const addCustomTrustline = () => setCustomTrustlineDialogOpen(true)
  const closeCustomTrustlineDialog = () => setCustomTrustlineDialogOpen(false)
  const onRemoveTrustline = (asset: Asset) => setRemovalDialogAsset(asset)

  return (
    <ErrorBoundary>
      <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
        <HorizontalLayout alignItems="center" margin="0 0 24px">
          <BackButton onClick={props.onClose} />
          <Typography variant="h5" style={{ flexGrow: 1 }}>
            Manage Assets
          </Typography>
          <Button color="primary" onClick={addCustomTrustline} style={{ marginLeft: 32 }} variant="contained">
            <ButtonIconLabel label="Add Custom Asset">
              <AddIcon />
            </ButtonIconLabel>
          </Button>
        </HorizontalLayout>
        <TrustlineList account={props.account} onAddTrustline={addAsset} onRemoveTrustline={onRemoveTrustline} />
      </Box>
      <CustomTrustlineDialog
        account={props.account}
        horizon={props.horizon}
        open={isCustomTrustlineDialogOpen}
        onClose={closeCustomTrustlineDialog}
        sendTransaction={props.sendTransaction}
      />
      <RemoveTrustlineDialog
        account={props.account}
        accountData={accountData}
        asset={removalDialogAsset || Asset.native()}
        open={removalDialogAsset !== null}
        onClose={() => setRemovalDialogAsset(null)}
      />
    </ErrorBoundary>
  )
}

function ManageAssetsContainer(props: Pick<Props, "account" | "onClose">) {
  const accountsContext = React.useContext(AccountsContext)
  return (
    <TransactionSender account={props.account}>
      {txContext => <ManageAssets {...props} {...accountsContext} {...txContext} />}
    </TransactionSender>
  )
}

export default ManageAssetsContainer

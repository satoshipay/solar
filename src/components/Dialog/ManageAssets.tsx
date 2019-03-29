import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import AddIcon from "@material-ui/icons/Add"
import { Account, AccountsContext } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import TrustlineList from "../Account/TrustlineList"
import { Box } from "../Layout/Box"
import ButtonIconLabel from "../ButtonIconLabel"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import CustomTrustlineDialog from "./CustomTrustline"
import RemoveTrustlineDialog from "./RemoveTrustline"

const Transition = (props: any) => <Slide {...props} direction="left" />

interface Props {
  account: Account
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function ManageAssets(props: Props) {
  const [isCustomTrustlineDialogOpen, setCustomTrustlineDialogOpen] = React.useState(false)
  const [removalDialogAsset, setRemovalDialogAsset] = React.useState<Asset | null>(null)

  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const isWidthMax500 = useMediaQuery("(max-width:500px)")

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
    <Dialog open={props.open} fullScreen onClose={props.onClose} TransitionComponent={Transition}>
      <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
        <MainTitle
          title="Manage Assets"
          actions={
            <>
              <Button color="primary" onClick={addCustomTrustline} variant="contained">
                <ButtonIconLabel label={isWidthMax500 ? "Custom" : "Add Custom Asset"}>
                  <AddIcon />
                </ButtonIconLabel>
              </Button>
            </>
          }
          onBack={props.onClose}
          style={{ marginBottom: 24 }}
        />
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
    </Dialog>
  )
}

function ManageAssetsContainer(props: Pick<Props, "account" | "open" | "onClose">) {
  const accountsContext = React.useContext(AccountsContext)
  return (
    <TransactionSender account={props.account}>
      {txContext => <ManageAssets {...props} {...accountsContext} {...txContext} />}
    </TransactionSender>
  )
}

export default ManageAssetsContainer

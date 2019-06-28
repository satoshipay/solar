import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import Slide from "@material-ui/core/Slide"
import AddIcon from "@material-ui/icons/Add"
import { Account, AccountsContext } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import TrustlineList from "../Account/TrustlineList"
import { Box } from "../Layout/Box"
import ButtonIconLabel from "../ButtonIconLabel"
import ErrorBoundary from "../ErrorBoundary"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import CustomTrustlineDialog from "./CustomTrustline"
import RemoveTrustlineDialog from "./RemoveTrustline"

const DialogTransition = React.forwardRef((props: TransitionProps, ref) => (
  <Slide ref={ref} {...props} direction="up" />
))

interface Props {
  account: Account
  horizon: Server
  onClose: () => void
  sendTransaction: (account: Account, transaction: Transaction) => void
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
      props.sendTransaction(props.account, transaction)
    } catch (error) {
      trackError(error)
    }
  }

  const {
    addCustomTrustline,
    closeCustomTrustlineDialog,
    closeRemoveTrustlineDialog,
    onRemoveTrustline
  } = React.useMemo(
    () => {
      return {
        addCustomTrustline: () => setCustomTrustlineDialogOpen(true),
        closeCustomTrustlineDialog: () => setCustomTrustlineDialogOpen(false),
        closeRemoveTrustlineDialog: () => setRemovalDialogAsset(null),
        onRemoveTrustline: (asset: Asset) => setRemovalDialogAsset(asset)
      }
    },
    [setCustomTrustlineDialogOpen, setRemovalDialogAsset]
  )

  return (
    <ErrorBoundary>
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
      <Dialog
        open={isCustomTrustlineDialogOpen}
        onClose={closeCustomTrustlineDialog}
        TransitionComponent={DialogTransition}
      >
        <CustomTrustlineDialog
          account={props.account}
          accountData={accountData}
          horizon={props.horizon}
          onClose={closeCustomTrustlineDialog}
          sendTransaction={props.sendTransaction}
        />
      </Dialog>
      <Dialog
        open={removalDialogAsset !== null}
        onClose={closeRemoveTrustlineDialog}
        TransitionComponent={DialogTransition}
      >
        <RemoveTrustlineDialog
          account={props.account}
          accountData={accountData}
          asset={removalDialogAsset || Asset.native()}
          onClose={closeRemoveTrustlineDialog}
        />
      </Dialog>
    </ErrorBoundary>
  )
}

function ManageAssetsContainer(props: Pick<Props, "account" | "onClose">) {
  const accountsContext = React.useContext(AccountsContext)
  return (
    <TransactionSender testnet={props.account.testnet}>
      {txContext => <ManageAssets {...props} {...accountsContext} {...txContext} />}
    </TransactionSender>
  )
}

export default ManageAssetsContainer

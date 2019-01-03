import React from "react"
import { useContext, useState } from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import AddIcon from "@material-ui/icons/Add"
import { Account, AccountsContext } from "../../context/accounts"
import { DialogsContext } from "../../context/dialogs"
import { DialogBlueprint, DialogType } from "../../context/dialogTypes"
import { trackError } from "../../context/notifications"
import { createTransaction } from "../../lib/transaction"
import TrustlineList from "../Account/TrustlineList"
import { Box, HorizontalLayout } from "../Layout/Box"
import ButtonIconLabel from "../ButtonIconLabel"
import TransactionSender from "../TransactionSender"
import BackButton from "./BackButton"
import CustomTrustlineDialog from "./CustomTrustline"

const Transition = (props: SlideProps) => <Slide {...props} direction="left" />

function createRemoveTrustlineDialog(account: Account, asset: Asset): DialogBlueprint {
  return {
    type: DialogType.RemoveTrustline,
    props: {
      account,
      asset
    }
  }
}

interface Props {
  account: Account
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function ManageAssets(props: Props) {
  const { openDialog } = useContext(DialogsContext)
  const [isCustomTrustlineDialogOpen, setCustomTrustlineDialogOpen] = useState(false)

  const addAsset = async (asset: Asset, options: { limit?: string } = {}) => {
    try {
      const operations = [Operation.changeTrust({ asset, limit: options.limit })]
      const transaction = await createTransaction(operations, {
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
  const removeTrustline = (asset: Asset) => openDialog(createRemoveTrustlineDialog(props.account, asset))

  return (
    <Dialog open={props.open} fullScreen onClose={props.onClose} TransitionComponent={Transition}>
      <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
        <HorizontalLayout alignItems="center" margin="0 0 24px">
          <BackButton onClick={props.onClose} />
          <Typography variant="headline" style={{ flexGrow: 1 }}>
            Manage Assets
          </Typography>
          <Button color="primary" onClick={addCustomTrustline} style={{ marginLeft: 32 }} variant="contained">
            <ButtonIconLabel label="Add Custom Asset">
              <AddIcon />
            </ButtonIconLabel>
          </Button>
        </HorizontalLayout>
        <TrustlineList account={props.account} onAddAsset={addAsset} onRemoveTrustline={removeTrustline} />
      </Box>
      <CustomTrustlineDialog
        account={props.account}
        horizon={props.horizon}
        open={isCustomTrustlineDialogOpen}
        onClose={closeCustomTrustlineDialog}
        sendTransaction={props.sendTransaction}
      />
    </Dialog>
  )
}

function ManageAssetsContainer(props: Pick<Props, "account" | "open" | "onClose">) {
  const accountsContext = useContext(AccountsContext)
  const dialogsContext = useContext(DialogsContext)
  return (
    <TransactionSender account={props.account}>
      {txContext => <ManageAssets {...props} {...accountsContext} {...dialogsContext} {...txContext} />}
    </TransactionSender>
  )
}

export default ManageAssetsContainer

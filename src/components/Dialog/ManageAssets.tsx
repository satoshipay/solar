import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import AddIcon from "@material-ui/icons/Add"
import { Account, AccountsConsumer } from "../../context/accounts"
import { DialogsConsumer, DialogsContextType } from "../../context/dialogs"
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
  openDialog: DialogsContextType["openDialog"]
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

interface State {
  isCustomTrustlineDialogOpen: boolean
}

class ManageAssets extends React.Component<Props, State> {
  state: State = {
    isCustomTrustlineDialogOpen: false
  }

  addAsset = async (asset: Asset, options: { limit?: string } = {}) => {
    try {
      const operations = [Operation.changeTrust({ asset, limit: options.limit })]
      const transaction = await createTransaction(operations, {
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })
      this.props.sendTransaction(transaction)
    } catch (error) {
      trackError(error)
    }
  }

  addCustomTrustline = () => {
    this.setState({ isCustomTrustlineDialogOpen: true })
  }

  closeCustomTrustlineDialog = () => {
    this.setState({ isCustomTrustlineDialogOpen: false })
  }

  removeTrustline = (asset: Asset) => {
    this.props.openDialog(createRemoveTrustlineDialog(this.props.account, asset))
  }

  render() {
    return (
      <Dialog open={this.props.open} fullScreen onClose={this.props.onClose} TransitionComponent={Transition}>
        <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
          <HorizontalLayout alignItems="center" margin="0 0 24px">
            <BackButton onClick={this.props.onClose} />
            <Typography variant="headline" style={{ flexGrow: 1 }}>
              Manage Assets
            </Typography>
            <Button color="primary" onClick={this.addCustomTrustline} style={{ marginLeft: 32 }} variant="contained">
              <ButtonIconLabel label="Add Custom Asset">
                <AddIcon />
              </ButtonIconLabel>
            </Button>
          </HorizontalLayout>
          <TrustlineList
            account={this.props.account}
            onAddAsset={this.addAsset}
            onRemoveTrustline={this.removeTrustline}
          />
        </Box>
        <CustomTrustlineDialog
          account={this.props.account}
          horizon={this.props.horizon}
          open={this.state.isCustomTrustlineDialogOpen}
          onClose={this.closeCustomTrustlineDialog}
          sendTransaction={this.props.sendTransaction}
        />
      </Dialog>
    )
  }
}

const ManageAssetsContainer = (props: Pick<Props, "account" | "open" | "onClose">) => {
  return (
    <AccountsConsumer>
      {accountsContext => (
        <DialogsConsumer>
          {dialogsContext => (
            <TransactionSender account={props.account}>
              {txContext => <ManageAssets {...props} {...accountsContext} {...dialogsContext} {...txContext} />}
            </TransactionSender>
          )}
        </DialogsConsumer>
      )}
    </AccountsConsumer>
  )
}

export default ManageAssetsContainer

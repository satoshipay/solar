import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import IconButton from "@material-ui/core/IconButton"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import AddIcon from "@material-ui/icons/Add"
import ArrowBackIcon from "@material-ui/icons/ArrowBack"
import { Account, AccountsConsumer } from "../../context/accounts"
import { DialogsConsumer, DialogsContext } from "../../context/dialogs"
import { DialogBlueprint, DialogType } from "../../context/dialogTypes"
import { addError } from "../../context/notifications"
import { createTransaction } from "../../lib/transaction"
import TrustlineList from "../Account/TrustlineList"
import { Box, HorizontalLayout } from "../Layout/Box"
import ButtonIconLabel from "../ButtonIconLabel"
import TransactionSender from "../TransactionSender"

const BackButton = (props: { onClick?: () => void; style?: React.CSSProperties }) => {
  return (
    <IconButton color="inherit" onClick={props.onClick} style={props.style}>
      <ArrowBackIcon style={{ fontSize: "inherit" }} />
    </IconButton>
  )
}

const Transition = (props: SlideProps) => <Slide {...props} direction="left" />

function createCustomTrustlineDialog(account: Account): DialogBlueprint {
  return {
    type: DialogType.CustomTrustline,
    props: {
      account
    }
  }
}

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
  openDialog: DialogsContext["openDialog"]
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

class ManageAssets extends React.Component<Props> {
  addAsset = async (asset: Asset, options: { limit?: string } = {}) => {
    try {
      const operations = [Operation.changeTrust({ asset, limit: options.limit })]
      const transaction = await createTransaction(operations, {
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })
      this.props.sendTransaction(transaction)
    } catch (error) {
      addError(error)
    }
  }

  addCustomTrustline = () => {
    this.props.openDialog(createCustomTrustlineDialog(this.props.account))
  }
  removeTrustline = (asset: Asset) => {
    this.props.openDialog(createRemoveTrustlineDialog(this.props.account, asset))
  }

  render() {
    return (
      <Dialog open={this.props.open} fullScreen onClose={this.props.onClose} TransitionComponent={Transition}>
        <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
          <HorizontalLayout alignItems="center" margin="0 0 24px">
            <BackButton
              onClick={this.props.onClose}
              style={{ marginLeft: -10, marginRight: 10, padding: 6, fontSize: 32 }}
            />
            <Typography variant="headline" style={{ flexGrow: 1 }}>
              Manage Trustlines
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

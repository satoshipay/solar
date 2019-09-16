import React from "react"
import { Asset, AssetType, Horizon, Operation, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import List from "@material-ui/core/List"
import Slide from "@material-ui/core/Slide"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import AddIcon from "@material-ui/icons/Add"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAssetMetadata } from "../../hooks/stellar"
import { ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useRouter } from "../../hooks/userinterface"
import * as popularAssets from "../../lib/popularAssets"
import { stringifyAsset } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import DialogBody from "../Dialog/DialogBody"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import BalanceDetailsListItem from "./BalanceDetailsListItem"
import ButtonListItem from "./ButtonListItem"
import CustomTrustlineDialog from "./CustomTrustline"

const DialogTransition = React.forwardRef((props: TransitionProps, ref) => (
  <Slide {...props} direction="up" ref={ref} />
))

function assetToBalance(asset: Asset): Horizon.BalanceLineAsset {
  return {
    asset_code: asset.getCode(),
    asset_issuer: asset.getIssuer(),
    asset_type: asset.getAssetType() as AssetType.credit4 | AssetType.credit12,
    balance: "0",
    last_modified_ledger: 0,
    limit: "0",
    buying_liabilities: "0",
    selling_liabilities: "0"
  }
}

interface AddAssetDialogProps {
  account: Account
  accountData: ObservedAccountData
  horizon: Server
  hpadding: number
  itemHPadding: number
  onClose: () => void
  sendTransaction: (transaction: Transaction, signatureRequest?: null) => void
}

function AddAssetDialog(props: AddAssetDialogProps) {
  const assets = props.account.testnet ? popularAssets.testnet : popularAssets.mainnet
  const assetMetadata = useAssetMetadata(assets, props.account.testnet)
  const router = useRouter()
  const [customTrustlineDialogOpen, setCustomTrustlineDialogOpen] = React.useState(false)
  const [txCreationPending, setTxCreationPending] = React.useState(false)

  const openAssetDetails = (asset: Asset) =>
    router.history.push(routes.assetDetails(props.account.id, stringifyAsset(asset)))

  const openCustomTrustlineDialog = () => setCustomTrustlineDialogOpen(true)
  const closeCustomTrustlineDialog = () => setCustomTrustlineDialogOpen(false)

  const createAddAssetTransaction = async (asset: Asset, options: { limit?: string } = {}) => {
    const operations = [Operation.changeTrust({ asset, limit: options.limit })]
    return createTransaction(operations, {
      accountData: props.accountData,
      horizon: props.horizon,
      walletAccount: props.account
    })
  }

  const sendTransaction = async (createTransactionToSend: () => Promise<Transaction>) => {
    try {
      setTxCreationPending(true)
      const transaction = await createTransactionToSend()
      setTxCreationPending(false)
      await props.sendTransaction(transaction)
    } catch (error) {
      setTxCreationPending(false)
      trackError(error)
    }
  }

  const isAssetAlreadyAdded = (asset: Asset) => {
    return props.accountData.balances.some(
      (balance: any) => balance.asset_code === asset.code && balance.asset_issuer === asset.issuer
    )
  }

  const notYetAddedAssets = assets.filter(asset => !isAssetAlreadyAdded(asset))

  return (
    <DialogBody excessWidth={12} top={<MainTitle onBack={props.onClose} title="Add Asset" />}>
      <List style={{ paddingLeft: props.hpadding, paddingRight: props.hpadding }}>
        <ButtonListItem gutterBottom onClick={openCustomTrustlineDialog}>
          <AddIcon />
          &nbsp;&nbsp;Add Custom Asset
        </ButtonListItem>
        {notYetAddedAssets.map(asset => {
          const [metadata] = assetMetadata.get(asset) || [undefined, false]
          return (
            <BalanceDetailsListItem
              key={stringifyAsset(asset)}
              assetMetadata={metadata}
              balance={assetToBalance(asset)}
              hideBalance
              onClick={() => openAssetDetails(asset)}
              style={{ paddingLeft: props.itemHPadding, paddingRight: props.itemHPadding }}
              testnet={props.account.testnet}
            />
          )
        })}
      </List>
      <Dialog
        open={customTrustlineDialogOpen}
        onClose={closeCustomTrustlineDialog}
        TransitionComponent={DialogTransition}
      >
        <CustomTrustlineDialog
          account={props.account}
          accountData={props.accountData}
          createAddAssetTransaction={createAddAssetTransaction}
          horizon={props.horizon}
          onClose={closeCustomTrustlineDialog}
          sendTransaction={sendTransaction}
          txCreationPending={txCreationPending}
        />
      </Dialog>
    </DialogBody>
  )
}

function ConnectedAddAssetDialog(props: Omit<AddAssetDialogProps, "horizon" | "sendTransaction">) {
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <AddAssetDialog {...props} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default React.memo(ConnectedAddAssetDialog)

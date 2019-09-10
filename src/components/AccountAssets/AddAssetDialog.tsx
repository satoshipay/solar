import React from "react"
import { Asset, AssetType, Horizon, Operation, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import AddIcon from "@material-ui/icons/Add"
import ExpandLessIcon from "@material-ui/icons/ExpandLess"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAssetMetadata } from "../../hooks/stellar"
import { ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useRouter } from "../../hooks/userinterface"
import * as popularAssets from "../../lib/popularAssets"
import { stringifyAsset } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import { CompactDialogTransition } from "../../theme"
import DialogBody from "../Dialog/DialogBody"
import { SearchField } from "../Form/FormFields"
import { VerticalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import BalanceDetailsListItem from "./BalanceDetailsListItem"
import ButtonListItem from "./ButtonListItem"
import CustomTrustlineDialog from "./CustomTrustline"

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

const useAddAssetStyles = makeStyles({
  expandIcon: {
    fontSize: 32
  },
  list: {
    flexGrow: 1,
    marginTop: 32,
    padding: 0
  },
  searchField: {
    background: "white"
  },
  searchFieldInput: {
    fontSize: 16,
    paddingTop: 14,
    paddingBottom: 14
  }
})

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
  const classes = useAddAssetStyles()
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
    <DialogBody excessWidth={24} top={<MainTitle onBack={props.onClose} title="Add Asset" />}>
      <VerticalLayout margin="16px 0 0">
        <SearchField
          className={classes.searchField}
          inputProps={{
            className: classes.searchFieldInput
          }}
          placeholder="Search assets by code or name…"
        />
        <List className={classes.list}>
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
                testnet={props.account.testnet}
              />
            )
          })}
          {[0 /* FIXME */].map((/* issuer */) => (
            <>
              <ListItem button style={{ marginTop: 16 }}>
                <ListItemText primary="example.com" secondary="Example Stellar token issuer" />
                <ListItemIcon>
                  {/* FIXME */ true ? (
                    <ExpandLessIcon className={classes.expandIcon} />
                  ) : (
                    <ExpandMoreIcon className={classes.expandIcon} />
                  )}
                </ListItemIcon>
              </ListItem>
              {[0 /* FIXME */].map((/* asset */) => (
                <BalanceDetailsListItem
                  key={"TODO"}
                  assetMetadata={undefined}
                  balance={assetToBalance(Asset.native())}
                  hideBalance
                  onClick={() => openAssetDetails(Asset.native())}
                  style={{ paddingLeft: 24 }}
                  testnet={props.account.testnet}
                />
              ))}
            </>
          ))}
        </List>
      </VerticalLayout>
      <Dialog
        open={customTrustlineDialogOpen}
        onClose={closeCustomTrustlineDialog}
        TransitionComponent={CompactDialogTransition}
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

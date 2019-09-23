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
import { useStellarAssets, AssetRecord } from "../../hooks/stellar-ecosystem"
import { ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useRouter } from "../../hooks/userinterface"
import * as popularAssets from "../../lib/popularAssets"
import { assetRecordToAsset, stringifyAsset } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import { CompactDialogTransition } from "../../theme"
import DialogBody from "../Dialog/DialogBody"
import { AccountName } from "../Fetchers"
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

function groupAssets(values: AssetRecord[], createKey: (arg: AssetRecord) => string) {
  const map: { [issuer: string]: AssetRecord[] } = {}

  for (const value of values) {
    const key = createKey(value)
    const existingValues = map[key]
    existingValues ? existingValues.push(value) : (map[key] = [value])
  }

  return map
}

interface PopularAssetsProps {
  assets: Asset[]
  onOpenAssetDetails: (asset: Asset) => void
  testnet: boolean
}

const PopularAssets = React.memo(function PopularAssets(props: PopularAssetsProps) {
  const assetMetadata = useAssetMetadata(props.assets, props.testnet)

  return (
    <>
      {props.assets.map(asset => {
        const [metadata] = assetMetadata.get(asset) || [undefined, false]
        return (
          <BalanceDetailsListItem
            key={stringifyAsset(asset)}
            assetMetadata={metadata}
            balance={assetToBalance(asset)}
            hideBalance
            onClick={() => props.onOpenAssetDetails(asset)}
            testnet={props.testnet}
          />
        )
      })}
    </>
  )
})

interface SearchResultsProps {
  assetRecords: AssetRecord[]
  expanded: boolean
  issuer: string
  onOpenAssetDetails: (asset: Asset) => void
  testnet: boolean
  toggleExpansion: (issuer: string) => void
}

const SearchResults = React.memo(function SearchResults(props: SearchResultsProps) {
  return (
    <>
      <ListItem button key={props.issuer} onClick={() => props.toggleExpansion(props.issuer)}>
        <ListItemText
          primary={<AccountName publicKey={props.issuer} testnet={props.testnet} />}
          secondary={
            props.assetRecords.length === 1 ? `One matching asset` : `${props.assetRecords.length} matching assets`
          }
          secondaryTypographyProps={{
            style: { overflow: "hidden", textOverflow: "ellipsis" }
          }}
        />
        <ListItemIcon>
          {props.expanded ? <ExpandLessIcon style={{ fontSize: 32 }} /> : <ExpandMoreIcon style={{ fontSize: 32 }} />}
        </ListItemIcon>
      </ListItem>
      {props.expanded
        ? Object.values(
            props.assetRecords.map(assetRecord => (
              <BalanceDetailsListItem
                key={`${assetRecord.issuer}:${assetRecord.code}:${assetRecord.name}:${assetRecord.desc}`}
                assetMetadata={undefined}
                balance={assetToBalance(assetRecordToAsset(assetRecord))}
                hideBalance
                onClick={() => props.onOpenAssetDetails(assetRecordToAsset(assetRecord))}
                style={{ paddingLeft: 24 }}
                testnet={props.testnet}
              />
            ))
          )
        : undefined}
    </>
  )
})

const useAddAssetStyles = makeStyles({
  list: {
    flexGrow: 1,
    marginTop: 16,
    padding: 0
  },
  searchField: {
    background: "white",
    marginBottom: 16
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
  const classes = useAddAssetStyles()
  const knownAssets = useStellarAssets(props.account.testnet)
  const router = useRouter()
  const [customTrustlineDialogOpen, setCustomTrustlineDialogOpen] = React.useState(false)
  const [searchFieldValue, setSearchFieldValue] = React.useState("")
  const [expandedIssuers, setExpandedIssuers] = React.useState<string[]>([])
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

  const onSearchFieldChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchFieldValue(event.target.value)
  }, [])

  const toggleIssuer = React.useCallback(
    (issuer: string) => {
      setExpandedIssuers(expanded =>
        expanded.includes(issuer) ? expanded.filter(iss => iss !== issuer) : [...expanded, issuer]
      )
    },
    [expandedIssuers]
  )

  const assetsByIssuer = React.useMemo(() => {
    const allAssets = knownAssets.getAll() || []
    const filteredAssets = allAssets.filter(
      asset =>
        asset.code.toLowerCase().startsWith(searchFieldValue.toLowerCase()) ||
        asset.name.toLowerCase().startsWith(searchFieldValue.toLowerCase()) ||
        asset.issuer.toLowerCase().startsWith(searchFieldValue.toLowerCase())
    )

    return groupAssets(filteredAssets, assetRecord => assetRecord.issuer)
  }, [searchFieldValue])

  return (
    <DialogBody excessWidth={24} top={<MainTitle onBack={props.onClose} title="Add Asset" />}>
      <VerticalLayout margin="16px 0 0">
        <SearchField
          className={classes.searchField}
          inputProps={{
            className: classes.searchFieldInput
          }}
          onChange={onSearchFieldChange}
          value={searchFieldValue}
          placeholder="Search assets by code or name…"
        />
        <List className={classes.list}>
          <ButtonListItem onClick={openCustomTrustlineDialog}>
            <AddIcon />
            &nbsp;&nbsp;Add Custom Asset
          </ButtonListItem>
        </List>
        {searchFieldValue ? (
          Object.keys(assetsByIssuer).map(issuer => (
            <List className={classes.list}>
              <SearchResults
                assetRecords={assetsByIssuer[issuer]}
                expanded={expandedIssuers.includes(issuer)}
                issuer={issuer}
                onOpenAssetDetails={openAssetDetails}
                testnet={props.account.testnet}
                toggleExpansion={toggleIssuer}
              />
            </List>
          ))
        ) : (
          <List className={classes.list}>
            <PopularAssets
              assets={notYetAddedAssets}
              onOpenAssetDetails={openAssetDetails}
              testnet={props.account.testnet}
            />
          </List>
        )}
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

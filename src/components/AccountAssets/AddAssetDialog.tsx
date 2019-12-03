import React from "react"
import { Asset, AssetType, Horizon, Operation, Server, Transaction } from "stellar-sdk"
import CircularProgress from "@material-ui/core/CircularProgress"
import Dialog from "@material-ui/core/Dialog"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import AddIcon from "@material-ui/icons/Add"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useStellarAssets, useWellKnownAccounts, AssetRecord } from "../../hooks/stellar-ecosystem"
import { useRouter } from "../../hooks/userinterface"
import { AccountData } from "../../lib/account"
import * as popularAssets from "../../lib/popularAssets"
import { assetRecordToAsset, stringifyAsset } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import { CompactDialogTransition } from "../../theme"
import DialogBody from "../Dialog/DialogBody"
import { AccountName } from "../Fetchers"
import { SearchField } from "../Form/FormFields"
import { VerticalLayout } from "../Layout/Box"
import { FixedSizeList } from "../List/VirtualList"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import BalanceDetailsListItem from "./BalanceDetailsListItem"
import ButtonListItem from "./ButtonListItem"
import CustomTrustlineDialog from "./CustomTrustline"

function assetRecordMatches(assetRecord: AssetRecord, search: string) {
  search = search.toLowerCase()
  return assetRecord.code.toLowerCase().startsWith(search) || assetRecord.name.toLowerCase().startsWith(search)
}

function issuerMatches(issuerDetails: AssetRecord["issuer_detail"], search: string) {
  search = search.toLowerCase()
  return issuerDetails.name.toLowerCase().startsWith(search)
}

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
  return (
    <>
      {props.assets.map(asset => (
        <BalanceDetailsListItem
          key={stringifyAsset(asset)}
          balance={assetToBalance(asset)}
          hideBalance
          onClick={() => props.onOpenAssetDetails(asset)}
          testnet={props.testnet}
        />
      ))}
    </>
  )
})

const searchResultRowHeight = 73

const useSearchResultStyles = makeStyles({
  assetItem: {
    borderRadius: "0 !important",
    height: searchResultRowHeight
  },
  issuerItem: {
    background: "white",
    borderRadius: 8,
    height: searchResultRowHeight
  }
})

function createSearchResultRow(
  account: Account,
  assetsByIssuer: Record<string, AssetRecord[]>,
  openAssetDetails: (asset: Asset) => void
) {
  // tslint:disable-next-line interface-over-type-literal
  type AssetItemRecord = { type: "asset"; issuer: string; record: AssetRecord }
  // tslint:disable-next-line interface-over-type-literal
  type IssuerItemRecord = { type: "issuer"; issuer: string }

  const itemRenderMap: Array<AssetItemRecord | IssuerItemRecord> = []

  for (const issuer of Object.keys(assetsByIssuer)) {
    itemRenderMap.push({
      type: "issuer",
      issuer
    })
    itemRenderMap.push(
      ...assetsByIssuer[issuer].map(
        (assetRecord: AssetRecord): AssetItemRecord => ({
          type: "asset",
          issuer,
          record: assetRecord
        })
      )
    )
  }

  function SearchResultRow(props: { index: number; style: React.CSSProperties }) {
    const classes = useSearchResultStyles()
    const item = itemRenderMap[props.index]

    return (
      <div style={props.style}>
        {item.type === "issuer" ? (
          <ListItem key={item.issuer} className={classes.issuerItem}>
            <ListItemText
              primary={<AccountName publicKey={item.issuer} testnet={account.testnet} />}
              secondary={
                assetsByIssuer[item.issuer].length === 1
                  ? `One matching asset`
                  : `${assetsByIssuer[item.issuer].length} matching assets`
              }
              secondaryTypographyProps={{
                style: { overflow: "hidden", textOverflow: "ellipsis" }
              }}
            />
          </ListItem>
        ) : null}
        {item.type === "asset" ? (
          <BalanceDetailsListItem
            balance={assetToBalance(assetRecordToAsset(item.record))}
            className={classes.assetItem}
            hideBalance
            onClick={() => openAssetDetails(assetRecordToAsset(item.record))}
            style={{ paddingLeft: 32 }}
            testnet={account.testnet}
          />
        ) : null}
      </div>
    )
  }

  SearchResultRow.count = itemRenderMap.length
  return SearchResultRow
}

const useAddAssetStyles = makeStyles({
  grow: {
    flexGrow: 1
  },
  list: {
    marginTop: 16,
    padding: 0
  },
  searchField: {
    background: "white",
    flexShrink: 0,
    flexGrow: 0,
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
  accountData: AccountData
  horizon: Server
  hpadding: number
  itemHPadding: number
  onClose: () => void
  sendTransaction: (transaction: Transaction, signatureRequest?: null) => void
}

const AddAssetDialog = React.memo(function AddAssetDialog(props: AddAssetDialogProps) {
  const assets = props.account.testnet ? popularAssets.testnet : popularAssets.mainnet
  const classes = useAddAssetStyles()
  const containerRef = React.useRef<HTMLUListElement | null>(null)
  const allAssets = useStellarAssets(props.account.testnet)
  const router = useRouter()
  const wellKnownAccounts = useWellKnownAccounts(props.account.testnet)
  const [customTrustlineDialogOpen, setCustomTrustlineDialogOpen] = React.useState(false)
  const [searchFieldValue, setSearchFieldValue] = React.useState("")
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

  const wellknownAccountMatches = (accountID: string, search: string) => {
    const lowerCasedSearch = search.toLowerCase()
    const record = wellKnownAccounts.lookup(accountID)

    if (!record) {
      return false
    }
    return (
      record.domain.toLowerCase().includes(lowerCasedSearch) || record.name.toLowerCase().includes(lowerCasedSearch)
    )
  }

  const notYetAddedAssets = assets.filter(asset => !isAssetAlreadyAdded(asset))

  const onSearchFieldChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchFieldValue(event.target.value)
  }, [])

  const assetsByIssuer = React.useMemo(() => {
    const filteredAssets = allAssets.filter(
      assetRecord =>
        assetRecordMatches(assetRecord, searchFieldValue) ||
        issuerMatches(assetRecord.issuer_detail, searchFieldValue) ||
        wellknownAccountMatches(assetRecord.issuer, searchFieldValue)
    )

    return groupAssets(filteredAssets, assetRecord => assetRecord.issuer)
  }, [searchFieldValue, wellKnownAccounts.accounts])

  const SearchResultRow = React.useMemo(() => createSearchResultRow(props.account, assetsByIssuer, openAssetDetails), [
    props.account,
    assetsByIssuer
  ])

  return (
    <DialogBody excessWidth={24} top={<MainTitle onBack={props.onClose} title="Add Asset" />}>
      <VerticalLayout grow margin="16px 0 0">
        <SearchField
          autoFocus
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
          <ul className={`${classes.list} ${classes.grow}`} ref={containerRef}>
            <FixedSizeList
              container={containerRef.current}
              itemCount={SearchResultRow.count}
              itemSize={searchResultRowHeight}
            >
              {SearchResultRow}
            </FixedSizeList>
          </ul>
        ) : (
          <List className={`${classes.list} ${classes.grow}`}>
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
        <React.Suspense fallback={<CircularProgress />}>
          <CustomTrustlineDialog
            account={props.account}
            accountData={props.accountData}
            createAddAssetTransaction={createAddAssetTransaction}
            horizon={props.horizon}
            onClose={closeCustomTrustlineDialog}
            sendTransaction={sendTransaction}
            txCreationPending={txCreationPending}
          />
        </React.Suspense>
      </Dialog>
    </DialogBody>
  )
})

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

import BigNumber from "big.js"
import React from "react"
import { Asset, AssetType, Horizon, Operation, Server, Transaction } from "stellar-sdk"
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import GavelIcon from "@material-ui/icons/Gavel"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, useIsMobile, useHorizon, useRouter, ObservedAccountData } from "../../hooks"
import { balancelineToAsset } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import ScrollableBalances from "../AccountAssets/ScrollableBalances"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { VerticalMargin } from "../Layout/Spacing"
import TradingForm from "../TradeAsset/TradingForm"
import ErrorBoundary from "../ErrorBoundary"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import { ActionButton, DialogActionsBox } from "./Generic"

function findMatchingBalance(balances: ObservedAccountData["balances"], asset: Asset) {
  return balances.find(balance => balancelineToAsset(balance).equals(asset))
}

interface TradeAssetProps {
  account: Account
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function TradeAsset(props: TradeAssetProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const horizon = useHorizon(props.account.testnet)
  const isSmallScreen = useIsMobile()
  const router = useRouter()

  const trustlines = React.useMemo(
    () =>
      accountData.balances.filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native"),
    [accountData.balances]
  )

  const [rawBuyingAsset, setBuyingAsset] = React.useState<Asset | null>(null)
  const [rawSellingAsset, setSellingAsset] = React.useState<Asset | null>(null)

  // Cannot set fallback value in React.useState(), since `trustlines` will become available asynchronously
  const buyingAsset = rawBuyingAsset || (trustlines.length > 0 ? balancelineToAsset(trustlines[0]) : Asset.native())
  const sellingAsset = rawSellingAsset || Asset.native()

  const buyingBalance = findMatchingBalance(accountData.balances, buyingAsset)
  const sellingBalance = findMatchingBalance(accountData.balances, sellingAsset)

  const createOfferCreationTransaction = (selling: Asset, buying: Asset, amount: BigNumber, price: BigNumber) => {
    const tx = createTransaction(
      [
        Operation.manageSellOffer({
          amount: amount.toFixed(7),
          buying,
          offerId: 0,
          price: price.toFixed(7),
          selling
        })
      ],
      {
        accountData,
        horizon,
        walletAccount: props.account
      }
    )
    return tx
  }

  const awaitThenSendTransaction = async (txPromise: Promise<Transaction>) => {
    try {
      props.sendTransaction(await txPromise)
    } catch (error) {
      trackError(error)
    }
  }

  const MainContent = (
    <>
      <ScrollableBalances account={props.account} compact />
      <VerticalMargin size={isSmallScreen ? 12 : 40} />
      {buyingBalance && sellingBalance ? (
        <TradingForm
          buying={buyingAsset}
          buyingBalance={buyingBalance.balance}
          onSetBuying={setBuyingAsset}
          onSetSelling={setSellingAsset}
          selling={sellingAsset}
          sellingBalance={sellingBalance.balance}
          testnet={props.account.testnet}
          trustlines={trustlines}
          DialogActions={({ amount, disabled, price, style }) => (
            <HorizontalLayout justifyContent="flex-end" shrink={0} style={style}>
              <DialogActionsBox>
                <ActionButton
                  disabled={disabled}
                  icon={<GavelIcon />}
                  onClick={() =>
                    awaitThenSendTransaction(createOfferCreationTransaction(sellingAsset, buyingAsset, amount, price))
                  }
                  type="primary"
                >
                  Place order
                </ActionButton>
              </DialogActionsBox>
            </HorizontalLayout>
          )}
        />
      ) : null}
    </>
  )

  const LinkToManageAssets = React.useMemo(
    () => (
      <Box margin="32px 0 0" textAlign="center">
        <Typography>This account doesn't use any assets other than Stellar Lumens yet.</Typography>
        <DialogActionsBox desktopStyle={{ display: "block", alignSelf: "center" }}>
          <ActionButton
            autoFocus
            onClick={() => router.history.push(routes.manageAccountAssets(props.account.id))}
            type="primary"
          >
            Add asset
          </ActionButton>
        </DialogActionsBox>
      </Box>
    ),
    [props.account, router]
  )

  return (
    <ErrorBoundary>
      <VerticalLayout width="100%" maxWidth={900} padding="24px 32px" margin="0 auto">
        <MainTitle title="Trade" onBack={props.onClose} style={{ height: 56 }} />
        {trustlines.length > 0 ? MainContent : LinkToManageAssets}
      </VerticalLayout>
    </ErrorBoundary>
  )
}

function TradeAssetContainer(props: Pick<TradeAssetProps, "account" | "onClose">) {
  const router = useRouter()
  const navigateToAssets = () => router.history.push(routes.account(props.account.id))

  return (
    <TransactionSender account={props.account} onSubmissionCompleted={navigateToAssets}>
      {txContext => <TradeAsset {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default TradeAssetContainer

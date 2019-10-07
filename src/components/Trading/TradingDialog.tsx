import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon, Operation, Server, Transaction } from "stellar-sdk"
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import GavelIcon from "@material-ui/icons/Gavel"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useHorizon } from "../../hooks/stellar"
import { useLiveAccountData, ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useDialogActions, useIsMobile, useRouter } from "../../hooks/userinterface"
import { balancelineToAsset } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import ScrollableBalances from "../AccountAssets/ScrollableBalances"
import { VerticalMargin } from "../Layout/Spacing"
import MainTitle from "../MainTitle"
import TradingForm from "./TradingForm"
import TransactionSender from "../TransactionSender"
import DialogBody from "../Dialog/DialogBody"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import Portal from "../Portal"
import { HorizontalLayout } from "../Layout/Box"

function findMatchingBalance(balances: ObservedAccountData["balances"], asset: Asset) {
  return balances.find(balance => balancelineToAsset(balance).equals(asset))
}

interface Assets {
  buying: Asset | null
  selling: Asset | null
}

interface TradingDialogProps {
  account: Account
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function TradingDialog(props: TradingDialogProps) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const dialogActionsRef = useDialogActions()
  const horizon = useHorizon(props.account.testnet)
  const isSmallScreen = useIsMobile()
  const router = useRouter()

  const trustlines = React.useMemo(
    () =>
      accountData.balances.filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native"),
    [accountData.balances]
  )

  const [assets, setAssets] = React.useState<Assets>({ buying: null, selling: null })

  // Cannot set fallback value in React.useState(), since `trustlines` will become available asynchronously
  const buyingAsset = assets.buying || (trustlines.length > 0 ? balancelineToAsset(trustlines[0]) : Asset.native())
  const sellingAsset = assets.selling || Asset.native()

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

  const ActionsContainer = (subProps: { children: React.ReactNode; style?: React.CSSProperties }) =>
    isSmallScreen ? (
      <Portal target={dialogActionsRef.element}>{subProps.children}</Portal>
    ) : (
      <HorizontalLayout justifyContent="flex-end" shrink={0} style={subProps.style}>
        {subProps.children}
      </HorizontalLayout>
    )

  const MainContent = (
    <>
      <VerticalMargin size={24} />
      {buyingBalance && sellingBalance ? (
        <TradingForm
          buying={buyingAsset}
          buyingBalance={buyingBalance.balance}
          onSelectAssets={setAssets}
          selling={sellingAsset}
          sellingBalance={sellingBalance.balance}
          testnet={props.account.testnet}
          trustlines={trustlines}
          DialogActions={({ amount, disabled, price, style }) => (
            <ActionsContainer style={style}>
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
            </ActionsContainer>
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
    <DialogBody
      top={
        <>
          <MainTitle title="Trade" onBack={props.onClose} />
          <ScrollableBalances account={props.account} compact />
        </>
      }
      actions={dialogActionsRef}
    >
      {trustlines.length > 0 ? MainContent : LinkToManageAssets}
    </DialogBody>
  )
}

function TradingDialogContainer(props: Pick<TradingDialogProps, "account" | "onClose">) {
  const router = useRouter()
  const navigateToAssets = () => router.history.push(routes.account(props.account.id))

  return (
    <TransactionSender account={props.account} onSubmissionCompleted={navigateToAssets}>
      {txContext => <TradingDialog {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default TradingDialogContainer

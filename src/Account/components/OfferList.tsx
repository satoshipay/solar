import BigNumber from "big.js"
import React from "react"
import { Trans } from "react-i18next"
import { Operation, Server, ServerApi, Transaction } from "stellar-sdk"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import ArrowRightIcon from "@material-ui/icons/ArrowRightAlt"
import BarChartIcon from "@material-ui/icons/BarChart"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import { useHorizon } from "~Generic/hooks/stellar"
import { useLiveAccountData, useLiveAccountOffers } from "~Generic/hooks/stellar-subscriptions"
import { useIsMobile } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { offerAssetToAsset } from "~Generic/lib/stellar"
import { createTransaction } from "~Generic/lib/transaction"
import { HorizontalLayout } from "~Layout/components/Box"
import { List } from "~Layout/components/List"
import TransactionSender from "~Transaction/components/TransactionSender"
import { SingleBalance } from "./AccountBalances"

function createDismissalTransaction(
  horizon: Server,
  account: Account,
  accountData: AccountData,
  offer: ServerApi.OfferRecord
): Promise<Transaction> {
  return createTransaction(
    [
      Operation.manageSellOffer({
        offerId: offer.id,
        amount: "0",
        buying: offerAssetToAsset(offer.buying),
        price: offer.price,
        selling: offerAssetToAsset(offer.selling)
      })
    ],
    { accountData, horizon, walletAccount: account }
  )
}

interface OfferListItemProps {
  accountPublicKey: string
  offer: ServerApi.OfferRecord
  onCancel?: () => void
  style?: React.CSSProperties
}

const OfferListItem = React.memo(function OfferListItem(props: OfferListItemProps) {
  const buying = offerAssetToAsset(props.offer.buying)
  const selling = offerAssetToAsset(props.offer.selling)
  const isSmallScreen = useIsMobile()
  return (
    <ListItem
      button={Boolean(props.onCancel) as any}
      onClick={props.onCancel}
      style={{ minHeight: isSmallScreen ? 58 : 72, ...props.style }}
    >
      <ListItemIcon style={{ marginRight: isSmallScreen ? 0 : undefined }}>
        <BarChartIcon />
      </ListItemIcon>
      <ListItemText
        primary={
          // Horizon seems to always returns open offers in the format of us
          // on the seller side, no matter if we submitted a buy or sell order,
          // so we use the philosophy "i never 'sell XLM', 'i buy the <other asset>'"
          props.offer.seller === props.accountPublicKey && !selling.isNative() ? (
            <span style={{ fontWeight: "bold" }}>
              <Trans i18nKey="account.transactions.offer-list.text.sell">
                Sell
                <SingleBalance
                  assetCode={selling.getCode()}
                  balance={props.offer.amount}
                  inline
                  style={{ marginLeft: "0.35em", marginRight: "0.35em" }}
                />
                for
                <SingleBalance
                  assetCode={buying.getCode()}
                  balance={String(BigNumber(props.offer.amount).mul(props.offer.price))}
                  inline
                  style={{ marginLeft: "0.35em", marginRight: "0.35em" }}
                />
              </Trans>
            </span>
          ) : (
            <span style={{ fontWeight: "bold" }}>
              <Trans i18nKey="account.transactions.offer-list.text.buy">
                Buy
                <SingleBalance
                  assetCode={buying.getCode()}
                  balance={String(BigNumber(props.offer.amount).mul(props.offer.price))}
                  inline
                  style={{ marginLeft: "0.35em", marginRight: "0.35em" }}
                />
                for
                <SingleBalance
                  assetCode={selling.getCode()}
                  balance={props.offer.amount}
                  inline
                  style={{ marginLeft: "0.35em", marginRight: "0.35em" }}
                />
              </Trans>
            </span>
          )
        }
        primaryTypographyProps={{
          style: { overflow: "hidden", textOverflow: "ellipsis" }
        }}
        style={{ paddingRight: isSmallScreen ? 0 : undefined }}
      />
      <ListItemText
        primaryTypographyProps={{ align: "right" }}
        style={{ display: isSmallScreen ? "none" : undefined, flexShrink: 0, paddingRight: 0 }}
      >
        <HorizontalLayout alignItems="center" inline style={{ fontSize: "1.4rem" }}>
          <b>{selling.getCode()}</b>
          &nbsp;
          <ArrowRightIcon style={{ fontSize: "150%" }} />
          &nbsp;
          <b>{buying.getCode()}</b>
        </HorizontalLayout>
      </ListItemText>
    </ListItem>
  )
})

interface Props {
  account: Account
  title: React.ReactNode
}

function OfferList(props: Props & { sendTransaction: (tx: Transaction) => Promise<void> }) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const offers = useLiveAccountOffers(props.account.publicKey, props.account.testnet)
  const horizon = useHorizon(props.account.testnet)

  const onCancel = async (offer: ServerApi.OfferRecord) => {
    try {
      const tx = await createDismissalTransaction(horizon, props.account, accountData, offer)
      await props.sendTransaction(tx)
    } catch (error) {
      trackError(error)
    }
  }

  if (offers.length === 0) {
    return null
  } else {
    return (
      <List style={{ background: "transparent" }}>
        <ListSubheader disableSticky style={{ background: "transparent" }}>
          {props.title}
        </ListSubheader>
        {offers.map(offer => (
          <OfferListItem
            key={offer.id}
            accountPublicKey={props.account.publicKey}
            offer={offer}
            onCancel={() => onCancel(offer)}
          />
        ))}
      </List>
    )
  }
}

function OfferListContainer(props: Props) {
  return (
    <TransactionSender account={props.account}>
      {({ sendTransaction }) => <OfferList {...props} sendTransaction={sendTransaction} />}
    </TransactionSender>
  )
}

export default OfferListContainer

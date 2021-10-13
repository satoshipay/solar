import BigNumber from "big.js"
import React from "react"
import { Trans, useTranslation } from "react-i18next"
import { Operation, Server, ServerApi, Transaction } from "stellar-sdk"
import ExpansionPanel from "@material-ui/core/ExpansionPanel"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import makeStyles from "@material-ui/core/styles/makeStyles"
import ArrowRightIcon from "@material-ui/icons/ArrowRightAlt"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import BarChartIcon from "@material-ui/icons/BarChart"
import { Account } from "~App/contexts/accounts"
import { breakpoints } from "~App/theme"
import { trackError } from "~App/contexts/notifications"
import { ActionButton } from "~Generic/components/DialogActions"
import { useHorizon } from "~Generic/hooks/stellar"
import { useLoadingState } from "~Generic/hooks/util"
import { useLiveAccountData, useLiveAccountOffers, useOlderOffers } from "~Generic/hooks/stellar-subscriptions"
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
  const buying = offerAssetToAsset(offer.buying)
  const selling = offerAssetToAsset(offer.selling)

  if (selling.isNative()) {
    return createTransaction(
      [
        Operation.manageBuyOffer({
          offerId: offer.id,
          buyAmount: "0",
          buying,
          price: offer.price,
          selling,
          withMuxing: true
        })
      ],
      { accountData, horizon, walletAccount: account }
    )
  } else {
    return createTransaction(
      [
        Operation.manageSellOffer({
          offerId: offer.id,
          amount: "0",
          buying,
          price: offer.price,
          selling,
          withMuxing: true
        })
      ],
      { accountData, horizon, walletAccount: account }
    )
  }
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

interface LoadMoreOffersListItemProps {
  onClick: () => void
  pending?: boolean
}

const LoadMoreOffersListItem = React.memo(function LoadMoreOffersListItem(props: LoadMoreOffersListItemProps) {
  const { t } = useTranslation()
  return (
    <ListItem style={{ borderBottom: "none", height: 75 }}>
      <ListItemText disableTypography style={{ textAlign: "center" }}>
        <ActionButton
          onClick={props.onClick}
          loading={props.pending}
          style={{ margin: "0 auto", paddingLeft: 16, paddingRight: 16 }}
          variant="text"
        >
          {t("account.transactions.transaction-list.load-more.label")}
        </ActionButton>
      </ListItemText>
    </ListItem>
  )
})

interface Props {
  account: Account
  title: React.ReactNode
}

const useStyles = makeStyles({
  expansionPanel: {
    background: "transparent",

    "&:before": {
      background: "transparent"
    }
  },
  expansionPanelSummary: {
    justifyContent: "flex-start",
    minHeight: "48px !important",
    padding: 0
  },
  expansionPanelSummaryContent: {
    flexGrow: 0,
    marginTop: "0 !important",
    marginBottom: "0 !important"
  },
  expansionPanelDetails: {
    display: "block",
    padding: 0
  },
  listItem: {
    padding: "8px 24px",

    [breakpoints.down(600)]: {
      paddingLeft: 24,
      paddingRight: 24
    }
  }
})

function OfferList(props: Props & { sendTransaction: (tx: Transaction) => Promise<void> }) {
  const accountData = useLiveAccountData(props.account.accountID, props.account.testnet)
  const classes = useStyles()
  const horizon = useHorizon(props.account.testnet)
  const offerHistory = useLiveAccountOffers(props.account.publicKey, props.account.testnet)
  const [moreTxsLoadingState, handleMoreTxsFetch] = useLoadingState()
  const fetchMoreOffers = useOlderOffers(props.account.publicKey, props.account.testnet)

  const [expanded, setExpanded] = React.useState(true)

  const handleFetchMoreOffers = React.useCallback(() => handleMoreTxsFetch(fetchMoreOffers()), [
    fetchMoreOffers,
    handleMoreTxsFetch
  ])

  const onCancel = async (offer: ServerApi.OfferRecord) => {
    try {
      const tx = await createDismissalTransaction(horizon, props.account, accountData, offer)
      await props.sendTransaction(tx)
    } catch (error) {
      trackError(error)
    }
  }

  if (offerHistory.offers.length === 0) {
    return null
  } else {
    return (
      <List style={{ background: "transparent" }}>
        <ExpansionPanel
          className={classes.expansionPanel}
          elevation={0}
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
        >
          <ExpansionPanelSummary
            classes={{ root: classes.expansionPanelSummary, content: classes.expansionPanelSummaryContent }}
            expandIcon={<ExpandMoreIcon />}
          >
            <ListSubheader
              className={classes.listItem}
              disableSticky
              style={{ background: "transparent", paddingRight: 0 }}
            >
              {props.title}
            </ListSubheader>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className={classes.expansionPanelDetails}>
            {offerHistory.offers.map(offer => (
              <OfferListItem
                key={offer.id}
                accountPublicKey={props.account.accountID}
                offer={offer}
                onCancel={() => onCancel(offer)}
              />
            ))}
            {offerHistory.olderOffersAvailable ? (
              <LoadMoreOffersListItem
                pending={moreTxsLoadingState.type === "pending"}
                onClick={handleFetchMoreOffers}
              />
            ) : null}
          </ExpansionPanelDetails>
        </ExpansionPanel>
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

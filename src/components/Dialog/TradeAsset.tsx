import React from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import { useAccountData, ObservedAccountData } from "../../hooks"
import { AccountName } from "../Fetchers"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import TransactionSender from "../TransactionSender"
import BackButton from "./BackButton"

const Transition = (props: SlideProps) => <Slide {...props} direction="left" />

function findMatchingAsset(balances: ObservedAccountData["balances"], assetCode: string) {
  const matchingBalance = balances.find(balance => balance.asset_type !== "native" && balance.asset_code === assetCode)
  return matchingBalance && matchingBalance.asset_type !== "native"
    ? new Asset(matchingBalance.asset_code, matchingBalance.asset_issuer)
    : null
}

interface Props {
  account: Account
  assetCode: string
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function TradeAsset(props: Props) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const asset = findMatchingAsset(accountData.balances, props.assetCode)
  return (
    <Dialog open={props.open} fullScreen onClose={props.onClose} TransitionComponent={Transition}>
      <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
        <HorizontalLayout alignItems="center" margin="0 0 24px">
          <BackButton onClick={props.onClose} />
          <Typography variant="headline" style={{ flexGrow: 1 }}>
            Trade {props.assetCode}
          </Typography>
        </HorizontalLayout>
      </Box>
      <VerticalLayout>
        {asset ? (
          <Box textAlign="center">
            Issuer: <AccountName publicKey={asset.issuer} testnet={props.account.testnet} />
          </Box>
        ) : null}
      </VerticalLayout>
    </Dialog>
  )
}

function TradeAssetContainer(props: Pick<Props, "account" | "assetCode" | "open" | "onClose">) {
  return (
    <TransactionSender account={props.account}>
      {txContext => <TradeAsset {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default TradeAssetContainer

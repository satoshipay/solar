import React from "react"
import Button from "@material-ui/core/Button"
import CardActions from "@material-ui/core/CardActions"
import CardActionArea from "@material-ui/core/CardActionArea"
import CardContent from "@material-ui/core/CardContent"
import Card from "@material-ui/core/Card"
import makeStyles from "@material-ui/core/styles/makeStyles"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import { useHorizon } from "../../hooks/stellar"
import { useRouter } from "../../hooks/userinterface"
import { openLink } from "../../platform/links"
import * as routes from "../../routes"
import { CardList } from "../CardList"
import { MinimumAccountBalance } from "../Fetchers"
import FriendbotButton from "./FriendbotButton"

function createMoonPayURLForAccount(account: Account) {
  const baseURL = "https://buy-staging.moonpay.io/"
  const apiKEY = account.testnet ? "pk_test_RPUOOEJ7ZiAWlLFG6lbohDF9d2SqICX" : "pk_live_Xly1jO3hHE46AyMJO50lwoAk2VUCon"
  const currencyCode = "XLM"
  const colorCode = "1c8fea"
  return `${baseURL}?apiKey=${apiKEY}&currencyCode=${currencyCode}&walletAddress=${account.publicKey}&colorCode=%23${colorCode}`
}

const useStyles = makeStyles({
  card: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minWidth: 250,
    width: "40%",
    padding: "6px 12px",
    margin: "16px 0"
  }
})

interface DepositOptionCardProps {
  button: React.ReactElement
  description: React.ReactNode
  title: React.ReactNode
}

function DepositOptionCard(props: DepositOptionCardProps) {
  const classes = useStyles()

  return (
    <Card className={classes.card}>
      <CardActionArea disabled>
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            {props.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            {props.description}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions style={{ justifyContent: "center" }}>{props.button}</CardActions>
    </Card>
  )
}

interface LumenDepositOptionsProps {
  account: Account
}

function LumenDepositOptions(props: LumenDepositOptionsProps) {
  const horizon = useHorizon(props.account.testnet)
  const router = useRouter()

  const navigateToReceiveView = React.useCallback(() => {
    router.history.push(routes.receivePayment(props.account.id))
  }, [props.account.id])

  const navigateToMoonPay = React.useCallback(() => openLink(createMoonPayURLForAccount(props.account)), [
    props.account.publicKey
  ])

  return (
    <CardList margin="-16px 0" width="100%">
      {props.account.testnet ? (
        <DepositOptionCard
          button={<FriendbotButton color="primary" horizon={horizon} publicKey={props.account.publicKey} />}
          description={
            <>Just ask the friendbot to send you some funds to activate your account. Only available on test network.</>
          }
          title="Friendbot"
        />
      ) : null}
      <DepositOptionCard
        button={
          <Button color="primary" onClick={navigateToMoonPay}>
            Deposit using MoonPay
          </Button>
        }
        description={
          <>
            MoonPay allows you to buy cryptocurrencies instantly with all major debit/credit cards and mobile payment
            methods.
          </>
        }
        title="MoonPay"
      />
      <DepositOptionCard
        button={
          <Button color="primary" onClick={navigateToReceiveView}>
            Show public key
          </Button>
        }
        description={
          <>
            You can send lumens from a different Stellar account to this one in order to activate it. Send at least{" "}
            <MinimumAccountBalance testnet={props.account.testnet} />
            &nbsp;XLM.
          </>
        }
        title="Send funds"
      />
    </CardList>
  )
}

export default React.memo(LumenDepositOptions)

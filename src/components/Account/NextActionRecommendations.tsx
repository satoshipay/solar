import React from "react"
import Box from "@material-ui/core/Box"
import Button from "@material-ui/core/Button"
import CardActions from "@material-ui/core/CardActions"
import CardActionArea from "@material-ui/core/CardActionArea"
import CardContent from "@material-ui/core/CardContent"
import Card from "@material-ui/core/Card"
import Divider from "@material-ui/core/Divider"
import makeStyles from "@material-ui/core/styles/makeStyles"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import { CardList } from "../CardList"
import { openLink } from "../../platform/links"
import { useIsMobile, useRouter } from "../../hooks"
import * as routes from "../../routes"

const useStyles = makeStyles({
  card: {
    width: "40%",
    padding: "0px 12px",
    margin: "16px 0"
  },
  button: {
    boxShadow: "0 0 0 white"
  }
})

interface RecommendedService {
  description: string
  name: string
  website: string
}

const recommendedServices: RecommendedService[] = [
  {
    name: "Coinbase",
    description:
      "Coinbase is a digital currency exchange that enables you to buy, sell and manage a huge variety of digial currencies.",
    website: "https://www.coinbase.com/"
  },
  {
    name: "Kraken",
    description:
      "Kraken is one of the most trusted cryptocurrency exchanges on the market and offers low fees, versatile funding options and rigorous security standards.",
    website: "https://www.kraken.com/"
  },
  {
    name: "MoonPay",
    description:
      "MoonPay allows you to buy cryptocurrencies instantly with all major debit/credit cards and mobile payment methods such as Apple Pay while providing the highest level of security for their users.",
    website: "https://buy.moonpay.io/?currencyCode=xlm"
  }
]

interface StyledCardProps {
  description: string
  style?: React.CSSProperties
  title: string
  buttonText: string
  onClick: () => void
}

function StyledCard(props: StyledCardProps) {
  const classes = useStyles()

  return (
    <Card
      className={classes.card}
      style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", ...props.style }}
    >
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
      <CardActions style={{ justifyContent: "center" }}>
        <Button className={classes.button} color="primary" onClick={props.onClick}>
          {props.buttonText}
        </Button>
      </CardActions>
    </Card>
  )
}

interface RecommendedServiceCardProps {
  service: RecommendedService
  style?: React.CSSProperties
}

function RecommendedServiceCard(props: RecommendedServiceCardProps) {
  const { service } = props

  const url = new URL(props.service.website).hostname

  return (
    <StyledCard
      description={service.description}
      buttonText={`Visit ${url}`}
      title={service.name}
      onClick={() => openLink(service.website)}
      {...props}
    />
  )
}

interface Props {
  account: Account
}

function NextActionRecommendations(props: Props) {
  const isSmallScreen = useIsMobile()
  const router = useRouter()

  const style = isSmallScreen ? { width: "90%" } : undefined

  const navigateToReceiveView = React.useCallback(() => {
    router.history.push(routes.receivePayment(props.account.id))
  }, [props.account.id])

  const ReceiveCard = React.useMemo(
    () => (
      <StyledCard
        title="Receive money"
        description="You can send money from a different Stellar account to this one in order to activate it."
        onClick={navigateToReceiveView}
        buttonText="Open Receive Dialog"
        style={style}
      />
    ),
    [navigateToReceiveView, style]
  )

  return (
    <Box margin="0 16px">
      <Divider />
      <Typography style={{ marginTop: "16px" }} align="center" variant="h5" color="textSecondary">
        Top up your account
      </Typography>

      <CardList>
        {recommendedServices.map((service, index) => (
          <RecommendedServiceCard key={index} service={service} style={style} />
        ))}
        {ReceiveCard}
      </CardList>
    </Box>
  )
}

export default NextActionRecommendations

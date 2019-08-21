import React from "react"
import ReactDOM from "react-dom"
import SwipeableViews from "react-swipeable-views"
import { Asset, Horizon } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import MobileStepper from "@material-ui/core/MobileStepper"
import makeStyles from "@material-ui/core/styles/makeStyles"
import LeftIcon from "@material-ui/icons/KeyboardArrowLeft"
import RightIcon from "@material-ui/icons/KeyboardArrowRight"
import { Account } from "../../context/accounts"
import { useAccountData, useAssetMetadata, useIsMobile } from "../../hooks"
import { stringifyAsset } from "../../lib/stellar"
import { breakpoints } from "../../theme"
import ScrollableBalanceItem from "./ScrollableBalanceItem"

function isAssetMatchingBalance(asset: Asset, balance: Horizon.BalanceLine): boolean {
  if (balance.asset_type === "native") {
    return asset.isNative()
  } else {
    return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer()
  }
}

const useScrollableBalancesStyles = makeStyles({
  root: {
    marginLeft: -8,
    marginRight: -8,

    [breakpoints.down(500)]: {
      marginLeft: -16,
      marginRight: -16
    }
  },
  canScroll: {
    WebkitMaskImage:
      "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 5%, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 1) 90%, rgba(0, 0, 0, 0.3) 95%, rgba(0, 0, 0, 0) 100%)"
  },
  canScrollLeft: {
    WebkitMaskPositionX: "0",
    WebkitMaskSize: "110%"
  },
  canScrollLeftRight: {
    WebkitMaskPositionX: "0",
    WebkitMaskSize: "100%"
  },
  canScrollRight: {
    WebkitMaskPositionX: "-10vw",
    WebkitMaskSize: "110%"
  },
  slide: {
    width: "auto !important"
  }
})

const useStepperStyles = makeStyles({
  root: {
    background: "transparent",
    margin: "4px auto 0",
    padding: 0,
    width: "fit-content",

    [breakpoints.down(600)]: {
      marginTop: 16,
      marginBottom: -12
    }
  },
  dotActive: {
    backgroundColor: "rgba(255, 255, 255, 0.9)"
  },
  hidden: {
    pointerEvents: "none",
    visibility: "hidden"
  },
  navButton: {
    marginLeft: 8,
    marginRight: 8,
    padding: 4
  },
  navButtonIcon: {
    color: "rgba(255, 255, 255, 0.9)"
  }
})

interface ScrollableBalancesProps {
  account: Account
  onClick?: () => void
  style?: React.CSSProperties
}

function ScrollableBalances(props: ScrollableBalancesProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const swipeableContainerRef = React.useRef<(HTMLDivElement & SwipeableViews) | null>(null)
  const [currentSlide, setCurrentSlide] = React.useState(0)

  const isSmallScreen = useIsMobile()
  const horizontal = !isSmallScreen

  const classes = useScrollableBalancesStyles({ horizontal })
  const stepperClasses = useStepperStyles({})

  const trustedAssets = accountData.balances
    .filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native")
    .map(balance => new Asset(balance.asset_code, balance.asset_issuer))

  const nativeBalance: Horizon.BalanceLineNative = accountData.balances.find(
    (balance): balance is Horizon.BalanceLineNative => balance.asset_type === "native"
  ) || {
    asset_type: "native",
    balance: "0",
    buying_liabilities: "0",
    selling_liabilities: "0"
  }

  const assetMetadata = useAssetMetadata(trustedAssets, props.account.testnet)

  const swipeableMasterContainer = swipeableContainerRef.current && ReactDOM.findDOMNode(swipeableContainerRef.current)
  const swipeableContainer = swipeableMasterContainer ? (swipeableMasterContainer.firstChild as HTMLDivElement) : null
  const slideCount = swipeableContainer ? Math.ceil(swipeableContainer.scrollWidth / swipeableContainer.clientWidth) : 1

  const canScrollLeft = currentSlide > 0
  const canScrollRight = currentSlide < slideCount - 1
  const scrollLeft = () => setCurrentSlide(index => index - 1)
  const scrollRight = () => setCurrentSlide(index => index + 1)

  const className = [
    classes.root,
    canScrollLeft || canScrollRight ? classes.canScroll : "",
    canScrollLeft && canScrollRight
      ? classes.canScrollLeftRight
      : canScrollLeft
        ? classes.canScrollLeft
        : canScrollRight
          ? classes.canScrollRight
          : ""
  ].join(" ")

  return (
    <>
      <SwipeableViews
        className={className}
        disableLazyLoading
        enableMouseEvents
        hysteresis={0.2}
        index={currentSlide}
        onChangeIndex={setCurrentSlide}
        ref={swipeableContainerRef}
        slideClassName={classes.slide}
        style={props.style}
      >
        {trustedAssets.map(asset => {
          const [metadata] = assetMetadata.get(asset) || [undefined, false]
          return (
            <ScrollableBalanceItem
              key={stringifyAsset(asset)}
              assetMetadata={metadata}
              balance={accountData.balances.find(balance => isAssetMatchingBalance(asset, balance))!}
              horizontal={horizontal}
              onClick={props.onClick}
            />
          )
        })}
        <ScrollableBalanceItem balance={nativeBalance} horizontal={horizontal} onClick={props.onClick} />
      </SwipeableViews>
      {canScrollLeft || canScrollRight ? (
        <MobileStepper
          activeStep={currentSlide}
          classes={{
            dotActive: stepperClasses.dotActive,
            root: stepperClasses.root
          }}
          backButton={
            <IconButton
              className={`${stepperClasses.navButton} ${canScrollLeft ? "" : stepperClasses.hidden}`}
              onClick={scrollLeft}
            >
              <LeftIcon className={stepperClasses.navButtonIcon} />
            </IconButton>
          }
          nextButton={
            <IconButton
              className={`${stepperClasses.navButton} ${canScrollRight ? "" : stepperClasses.hidden}`}
              onClick={scrollRight}
            >
              <RightIcon className={stepperClasses.navButtonIcon} />
            </IconButton>
          }
          position="static"
          steps={slideCount}
          variant="dots"
        />
      ) : null}
    </>
  )
}

export default React.memo(ScrollableBalances)

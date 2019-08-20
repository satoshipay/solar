import { Asset, Horizon } from "stellar-sdk"
import React from "react"
import IconButton from "@material-ui/core/IconButton"
import MobileStepper from "@material-ui/core/MobileStepper"
import makeStyles from "@material-ui/core/styles/makeStyles"
import LeftIcon from "@material-ui/icons/KeyboardArrowLeft"
import RightIcon from "@material-ui/icons/KeyboardArrowRight"
import { Account } from "../../context/accounts"
import { useAccountData, useAssetMetadata, useIsMobile } from "../../hooks"
import { stringifyAsset } from "../../lib/stellar"
import { breakpoints } from "../../theme"
import { useScrollHandlers } from "./hooks"
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
    display: "flex",
    fontSize: 18,
    marginLeft: -8,
    marginRight: -8,
    overflowX: "auto",
    scrollBehavior: "smooth",
    transition: "background .25s, -webkit-mask-position-x 1s, -webkit-mask-size 1s",
    WebkitOverflowScrolling: "touch",

    [breakpoints.down(600)]: {
      marginLeft: -16,
      marginRight: -16
    }
  },
  canScroll: {
    WebkitMaskImage:
      "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 5%, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 1) 90%, rgba(0, 0, 0, 0.3) 95%, rgba(0, 0, 0, 0) 100%)",

    [breakpoints.down(600)]: {
      WebkitMaskImage:
        "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 7.5%, rgba(0, 0, 0, 1) 15%, rgba(0, 0, 0, 1) 85%, rgba(0, 0, 0, 0.3) 92.5%, rgba(0, 0, 0, 0) 100%)"
    }
  },
  canScrollLeft: {
    WebkitMaskPositionX: "0",
    WebkitMaskSize: "110%",

    [breakpoints.down(600)]: {
      WebkitMaskSize: "115%"
    }
  },
  canScrollLeftRight: {
    WebkitMaskPositionX: "0",
    WebkitMaskSize: "100%"
  },
  canScrollRight: {
    WebkitMaskPositionX: "-10vw",
    WebkitMaskSize: "110%",

    [breakpoints.down(600)]: {
      WebkitMaskPositionX: "-15vw",
      WebkitMaskSize: "115%"
    }
  }
})

const useStepperStyles = makeStyles({
  root: {
    background: "transparent",
    margin: "4px auto 0",
    padding: 0,
    width: "fit-content",

    [breakpoints.down(600)]: {
      marginTop: 16
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
  const scrollHandlers = useScrollHandlers()

  const isSmallScreen = useIsMobile()
  const horizontal = !isSmallScreen || accountData.balances.length < 2

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
  const className = [
    classes.root,
    scrollHandlers.canScrollLeft || scrollHandlers.canScrollRight ? classes.canScroll : "",
    scrollHandlers.canScrollLeft && scrollHandlers.canScrollRight
      ? classes.canScrollLeftRight
      : scrollHandlers.canScrollLeft
        ? classes.canScrollLeft
        : scrollHandlers.canScrollRight
          ? classes.canScrollRight
          : ""
  ].join(" ")

  return (
    <>
      <div {...scrollHandlers.props} className={className} style={props.style}>
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
      </div>
      {scrollHandlers.canScrollLeft || scrollHandlers.canScrollRight ? (
        <MobileStepper
          activeStep={scrollHandlers.activeScrollStep}
          classes={{
            dotActive: stepperClasses.dotActive,
            root: stepperClasses.root
          }}
          backButton={
            <IconButton
              className={`${stepperClasses.navButton} ${scrollHandlers.canScrollLeft ? "" : stepperClasses.hidden}`}
              onClick={scrollHandlers.scrollLeft}
            >
              <LeftIcon className={stepperClasses.navButtonIcon} />
            </IconButton>
          }
          nextButton={
            <IconButton
              className={`${stepperClasses.navButton} ${scrollHandlers.canScrollRight ? "" : stepperClasses.hidden}`}
              onClick={scrollHandlers.scrollRight}
            >
              <RightIcon className={stepperClasses.navButtonIcon} />
            </IconButton>
          }
          position="static"
          steps={scrollHandlers.scrollStepCount}
          variant="dots"
        />
      ) : null}
    </>
  )
}

export default React.memo(ScrollableBalances)

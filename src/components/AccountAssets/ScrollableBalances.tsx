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
import { StellarTomlCurrency } from "../../types/stellar-toml"
import { SingleBalance } from "../Account/AccountBalances"
import AssetLogo from "./AssetLogo"

function isAssetMatchingBalance(asset: Asset, balance: Horizon.BalanceLine): boolean {
  if (balance.asset_type === "native") {
    return asset.isNative()
  } else {
    return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer()
  }
}

const maxHorizontalScroll = (dom: HTMLElement) => dom.scrollWidth - dom.clientWidth

// TypeScript version of <https://github.com/perrin4869/react-scroll-ondrag/blob/master/src/index.js>
function useScrollHandlers() {
  const domRef = React.useRef<HTMLElement | null>(null)
  const [, setCounterState] = React.useState(0)
  const [scrollState, setScrollState] = React.useState({
    activeScrollStep: 0,
    canScrollLeft: false,
    canScrollRight: false,
    scrollStepCount: 1
  })

  const forceRerender = () => setCounterState(counter => counter + 1)

  const getActiveScrollStep = (dom: HTMLElement) => {
    return Math.ceil(dom.scrollLeft / getScrollStepWidth(dom))
  }
  const getScrollStepWidth = (dom: HTMLElement) => {
    return dom.parentElement!.clientWidth / 2
  }

  const updateOverflowState = () => {
    if (!domRef.current) {
      return
    }

    const activeScrollStep = getActiveScrollStep(domRef.current)
    const canScrollLeft = domRef.current.scrollLeft > 0
    const canScrollRight = domRef.current.scrollLeft < maxHorizontalScroll(domRef.current)
    const scrollStepCount = Math.ceil(maxHorizontalScroll(domRef.current) / getScrollStepWidth(domRef.current)) + 1

    const scrollingHitBoundary =
      canScrollLeft !== scrollState.canScrollLeft || canScrollRight !== scrollState.canScrollRight
    const scrollStepsChanged =
      activeScrollStep !== scrollState.activeScrollStep || scrollStepCount !== scrollState.scrollStepCount

    console.log(">", {
      activeScrollStep,
      maxHorizontalScroll: maxHorizontalScroll(domRef.current),
      scrollLeft: domRef.current.scrollLeft,
      scrollStepCount,
      scrollStepWidth: getScrollStepWidth(domRef.current),
      scrollWidth: domRef.current.scrollWidth
    })
    if (scrollingHitBoundary || scrollStepsChanged) {
      setScrollState({ activeScrollStep, canScrollLeft, canScrollRight, scrollStepCount })
    }
  }

  const setRef = (domElement: HTMLElement | null) => {
    if (domElement && domElement !== domRef.current) {
      domRef.current = domElement
      updateOverflowState()
      forceRerender()
    }
  }

  const scrollLeft = React.useCallback(
    () => {
      if (domRef.current) {
        domRef.current.scrollBy({
          left: -getScrollStepWidth(domRef.current),
          behavior: "smooth"
        })
      }
    },
    [domRef.current]
  )

  const scrollRight = React.useCallback(
    () => {
      if (domRef.current) {
        domRef.current.scrollBy({
          left: getScrollStepWidth(domRef.current),
          behavior: "smooth"
        })
      }
    },
    [domRef.current]
  )

  return {
    ...scrollState,
    domRef,
    scrollLeft,
    scrollRight,
    props: {
      onLoad: React.useCallback(updateOverflowState, []),
      onScroll: React.useCallback(updateOverflowState, []),
      ref: React.useCallback(setRef, [])
    }
  }
}

interface ScrollableBalancesStyleProps {
  horizontal: boolean
}

const useBalanceItemStyles = makeStyles({
  root: (props: ScrollableBalancesStyleProps) => ({
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    flexDirection: props.horizontal ? "row" : "column",
    justifyContent: "flex-start",
    minWidth: 130,
    padding: "8px 16px",

    [breakpoints.down(600)]: {
      minWidth: 100,
      paddingLeft: props.horizontal ? undefined : 8,
      paddingRight: props.horizontal ? undefined : 8
    },
    [breakpoints.down(350)]: {
      minWidth: 90
    }
  }),
  clickable: {
    borderRadius: 6,
    cursor: "pointer",

    "&:hover": {
      background: "rgba(255, 255, 255, 0.05)"
    }
  },
  logo: (props: ScrollableBalancesStyleProps) => ({
    boxShadow: "0 0 2px #fff",
    boxSizing: "border-box",
    margin: 0,
    marginLeft: props.horizontal ? 0 : "auto",
    marginRight: props.horizontal ? 0 : "auto",
    width: 48,
    height: 48,

    [breakpoints.down(350)]: {
      width: 40,
      height: 40
    }
  }),
  balance: (props: ScrollableBalancesStyleProps) => ({
    fontSize: 16,
    marginTop: props.horizontal ? 0 : 8,
    marginLeft: props.horizontal ? 16 : 0,
    textAlign: props.horizontal ? "left" : "center"
  }),
  assetCode: {
    display: "block",
    fontWeight: 700
  }
})

interface BalanceWithLogoProps {
  assetMetadata?: StellarTomlCurrency
  balance: Horizon.BalanceLine
  horizontal: boolean
  onClick?: () => void
}

function BalanceWithLogo(props: BalanceWithLogoProps) {
  const classes = useBalanceItemStyles(props)

  return (
    <div className={`${classes.root} ${props.onClick ? classes.clickable : ""}`} onClick={props.onClick}>
      <AssetLogo
        balance={props.balance}
        className={classes.logo}
        imageURL={props.assetMetadata ? props.assetMetadata.image : undefined}
      />
      <div className={classes.balance}>
        <span className={classes.assetCode}>
          {props.balance.asset_type === "native" ? "XLM" : props.balance.asset_code}
        </span>
        <SingleBalance assetCode="" balance={props.balance.balance} inline />
      </div>
    </div>
  )
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
            <BalanceWithLogo
              key={stringifyAsset(asset)}
              assetMetadata={metadata}
              balance={accountData.balances.find(balance => isAssetMatchingBalance(asset, balance))!}
              horizontal={horizontal}
              onClick={props.onClick}
            />
          )
        })}
        <BalanceWithLogo balance={nativeBalance} horizontal={horizontal} onClick={props.onClick} />
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

import React from "react"
import { animated, useSpring } from "react-spring"
import { useDrag } from "react-use-gesture"
import { Asset, Horizon } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import makeStyles from "@material-ui/core/styles/makeStyles"
import LeftIcon from "@material-ui/icons/ArrowLeft"
import RightIcon from "@material-ui/icons/ArrowRight"
import { Account } from "../../context/accounts"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { stringifyAsset } from "../../lib/stellar"
import { breakpoints } from "../../theme"
import { sortBalances } from "../Account/AccountBalances"
import InlineLoader from "../InlineLoader"
import ScrollableBalanceItem, { getBalanceItemMinMaxWidth } from "./ScrollableBalanceItem"

function isAssetMatchingBalance(asset: Asset, balance: Horizon.BalanceLine): boolean {
  if (balance.asset_type === "native") {
    return asset.isNative()
  } else {
    return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer()
  }
}

const useScrollableBalancesStyles = makeStyles({
  root: {
    marginLeft: -10,
    marginRight: -10,
    position: "relative",

    [breakpoints.down(600)]: {
      marginLeft: -24,
      marginRight: -24
    }
  },
  sliderContainer: {
    marginLeft: 8,
    marginRight: 8,
    overflowX: "hidden"
  },
  slider: {
    display: "flex"
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
  scrollButton: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    boxSizing: "content-box",
    position: "absolute",
    top: "50%",
    marginTop: -22,
    padding: 2,
    width: 40,
    height: 40,

    "@media (hover: hover)": {
      "&:hover": {
        backgroundColor: "rgba(0, 0, 0, 0.12)"
      }
    },
    "@media (hover: none)": {
      "&, &:hover": {
        backgroundColor: "rgba(0, 0, 0, 0.08)"
      }
    },

    [breakpoints.down(600)]: {
      marginTop: -22,
      padding: 4,
      width: 36,
      height: 36
    }
  },
  scrollButtonLeft: {
    left: 6,

    [breakpoints.down(600)]: {
      left: 12
    }
  },
  scrollButtonRight: {
    right: 6,

    [breakpoints.down(600)]: {
      right: 12
    }
  },
  scrollButtonIcon: {
    color: "white",
    fontSize: 40,

    [breakpoints.down(600)]: {
      fontSize: 36
    }
  }
})

interface ScrollableBalancesProps {
  account: Account
  compact?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

function ScrollableBalances(props: ScrollableBalancesProps) {
  const { onClick } = props
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const balanceItemsRef = React.useRef<Map<number, HTMLElement | null>>(new Map())
  const classes = useScrollableBalancesStyles()
  const latestStepRef = React.useRef(0)
  const mouseState = React.useRef({ currentlyDragging: false, latestMouseMoveEndTime: 0 })
  const swipeableContainerRef = React.useRef<HTMLDivElement | null>(null)
  const [currentStep, setCurrentStep] = React.useState(0)
  const [spring, setSpring] = useSpring(() => ({ x: 0 }))

  const nativeBalance: Horizon.BalanceLineNative = accountData.balances.find(
    (balance): balance is Horizon.BalanceLineNative => balance.asset_type === "native"
  ) || {
    asset_type: "native",
    balance: "0",
    buying_liabilities: "0",
    selling_liabilities: "0"
  }

  const isAccountActivated = Number.parseFloat(nativeBalance.balance) > 0

  const trustedAssets = sortBalances(accountData.balances)
    .filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native")
    .map(balance => new Asset(balance.asset_code, balance.asset_issuer))

  const balancesPerStep = Math.max(Math.floor((window.innerWidth - 32 - 32) / getBalanceItemMinMaxWidth()[1]), 2)
  const stepCount = Math.ceil(accountData.balances.length / balancesPerStep)

  const getStepX = (step: number) => {
    step = Math.min(Math.max(step, 0), stepCount - 1)
    const balanceIndex = step * balancesPerStep

    if (step === 0) {
      // first step - need to check first as for a single step the last-step check would be true
      return 0
    } else if (step === stepCount - 1 && swipeableContainerRef.current) {
      // last step - make it align to the right
      return -(swipeableContainerRef.current.scrollWidth - swipeableContainerRef.current.clientWidth + 8)
    } else if (step > 0 && balanceItemsRef.current.has(balanceIndex)) {
      return -balanceItemsRef.current.get(balanceIndex)!.offsetLeft + (step > 0 ? 32 : 0)
    }
    return 0
  }

  const scrollTo = (newStep: number) => {
    latestStepRef.current = newStep
    setCurrentStep(newStep)
    setSpring({ x: getStepX(newStep) })
  }
  const scrollLeft = () => scrollTo(Math.max(latestStepRef.current - 1, 0))
  const scrollRight = () => scrollTo(Math.min(latestStepRef.current + 1, stepCount - 1))

  const bind = useDrag(({ cancel, delta, direction, distance, down }) => {
    const lastXBeforeGesture = getStepX(latestStepRef.current)

    if (down && Math.abs(delta[0]) > 50) {
      mouseState.current.currentlyDragging = false
      direction[0] < 0 ? scrollRight() : scrollLeft()
      cancel!()
    } else {
      mouseState.current.currentlyDragging = true
      setSpring({ x: down ? lastXBeforeGesture + delta[0] : lastXBeforeGesture })
    }

    if (distance > 5) {
      mouseState.current.latestMouseMoveEndTime = Date.now()
    }
  })

  const handleClick = React.useCallback(() => {
    const mouseDragJustHappened = Date.now() - mouseState.current.latestMouseMoveEndTime < 100

    if (onClick && !mouseDragJustHappened) {
      onClick()
    }
  }, [onClick])

  const canScrollLeft = currentStep > 0
  const canScrollRight = currentStep < stepCount - 1

  const className = [
    classes.sliderContainer,
    canScrollLeft || canScrollRight ? classes.canScroll : "",
    canScrollLeft && canScrollRight
      ? classes.canScrollLeftRight
      : canScrollLeft
      ? classes.canScrollLeft
      : canScrollRight
      ? classes.canScrollRight
      : ""
  ].join(" ")

  const balanceItems = React.useMemo(
    () => [
      ...trustedAssets.map((asset, index) => (
        <ScrollableBalanceItem
          key={stringifyAsset(asset)}
          ref={domElement => (domElement ? balanceItemsRef.current.set(index, domElement) : undefined)}
          balance={accountData.balances.find(balance => isAssetMatchingBalance(asset, balance))!}
          compact={props.compact}
          onClick={props.onClick && isAccountActivated ? handleClick : undefined}
          testnet={props.account.testnet}
        />
      )),
      <ScrollableBalanceItem
        key={stringifyAsset(Asset.native())}
        ref={domElement =>
          domElement ? balanceItemsRef.current.set(accountData.balances.length - 1, domElement) : undefined
        }
        balance={nativeBalance}
        compact={props.compact}
        onClick={props.onClick && isAccountActivated ? handleClick : undefined}
        testnet={props.account.testnet}
      />
    ],
    [
      accountData.balances,
      handleClick,
      isAccountActivated,
      nativeBalance,
      props.account.testnet,
      props.compact,
      props.onClick,
      trustedAssets
    ]
  )

  return (
    <div className={classes.root} style={props.style}>
      <div className={className}>
        <animated.div
          {...bind()}
          className={classes.slider}
          ref={swipeableContainerRef}
          style={{ transform: spring.x.interpolate(xi => `translate3d(${xi}px, 0, 0)`) }}
        >
          {balanceItems}
        </animated.div>
      </div>
      <IconButton
        className={`${classes.scrollButton} ${classes.scrollButtonLeft}`}
        onClick={scrollLeft}
        style={{ display: canScrollLeft ? undefined : "none" }}
      >
        <LeftIcon className={classes.scrollButtonIcon} />
      </IconButton>
      <IconButton
        className={`${classes.scrollButton} ${classes.scrollButtonRight}`}
        onClick={scrollRight}
        style={{ display: canScrollRight ? undefined : "none" }}
      >
        <RightIcon className={classes.scrollButtonIcon} />
      </IconButton>
    </div>
  )
}

function ScrollableBalancesWithFallback(props: ScrollableBalancesProps) {
  return (
    <React.Suspense fallback={<InlineLoader />}>
      <ScrollableBalances {...props} />
    </React.Suspense>
  )
}

export default React.memo(ScrollableBalancesWithFallback)

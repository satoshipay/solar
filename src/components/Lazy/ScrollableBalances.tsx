import React from "react"
import InlineLoader from "../Generic/InlineLoader"
import withFallback from "./withFallback"

const ScrollableBalances = React.lazy(() => import("../AccountAssets/ScrollableBalances"))
const LazyScrollableBalances = withFallback(ScrollableBalances, <InlineLoader />)

export default LazyScrollableBalances

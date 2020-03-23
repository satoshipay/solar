import React from "react"
import InlineLoader from "./InlineLoader"
import withFallback from "../hocs/withFallback"

const ScrollableBalances = React.lazy(() => import("../../Assets/components/ScrollableBalances"))
const LazyScrollableBalances = withFallback(ScrollableBalances, <InlineLoader />)

export default LazyScrollableBalances

import React from "react"

const maxHorizontalScroll = (dom: HTMLElement) => dom.scrollWidth - dom.clientWidth

export function useScrollHandlers() {
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

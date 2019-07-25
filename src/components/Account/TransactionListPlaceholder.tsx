import React from "react"
import ContentLoader from "react-content-loader"
import { VerticalLayout } from "../Layout/Box"

function SubtitlePlaceholder() {
  const width = window.innerWidth - 48
  return (
    <ContentLoader
      height={54}
      width={width}
      speed={2}
      primaryColor="#e8e8e8"
      secondaryColor="#e0e0e0"
      style={{ flex: "0 0 54px" }}
    >
      <rect x="16" y="22" rx="5" ry="5" width="140" height="16" />
    </ContentLoader>
  )
}

function TransactionLoadingPlaceholder() {
  const balanceWidth = window.innerWidth < 400 ? 70 : 140
  const width = window.innerWidth - 48
  return (
    <ContentLoader
      height={60}
      width={width}
      speed={2}
      primaryColor="#e8e8e8"
      secondaryColor="#e0e0e0"
      style={{ flex: "0 0 60px" }}
    >
      <circle cx="32" cy="32" r="14" />
      <rect x="72" y="10" rx="5" ry="5" width={width - balanceWidth - 64 - 52} height="24" />
      <rect x="72" y="40" rx="5" ry="5" width={Math.min(width - balanceWidth - 64 - 52, 300)} height="12" />
      <rect x={width - balanceWidth - 16} y="15" rx="5" ry="5" width={balanceWidth} height="32" />
    </ContentLoader>
  )
}

function TransactionListPlaceholder() {
  return (
    <VerticalLayout alignItems="center" height="100%" overflow="hidden" padding="0 12px" width="100%">
      <SubtitlePlaceholder />
      <VerticalLayout
        width="100%"
        overflow="hidden"
        style={{ background: "white", boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)" }}
      >
        <TransactionLoadingPlaceholder />
        <TransactionLoadingPlaceholder />
        <TransactionLoadingPlaceholder />
        <TransactionLoadingPlaceholder />
        <TransactionLoadingPlaceholder />
        <TransactionLoadingPlaceholder />
        <TransactionLoadingPlaceholder />
        <TransactionLoadingPlaceholder />
        <TransactionLoadingPlaceholder />
      </VerticalLayout>
    </VerticalLayout>
  )
}

export default TransactionListPlaceholder

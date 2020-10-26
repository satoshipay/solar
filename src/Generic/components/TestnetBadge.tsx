import React from "react"
import { useTranslation } from "react-i18next"
import { testnetColor } from "~App/theme"

const TestnetBadge = (props: { style?: React.CSSProperties }) => {
  const { t } = useTranslation()

  const style: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    top: -4,
    padding: "0.1rem 0.3rem",
    background: testnetColor.main,
    borderRadius: 3,
    color: "white",
    fontSize: "10px",
    lineHeight: "14px",
    textTransform: "uppercase",
    ...props.style
  }
  return <div style={style}>{t("generic.testnet-badge.label")}</div>
}

export default TestnetBadge

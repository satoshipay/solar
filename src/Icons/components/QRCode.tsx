import * as React from "react"
import SvgIcon from "@material-ui/core/SvgIcon"

const QRCodeIcon = (props: {
  className?: string
  onClick?: () => void
  role?: string
  style?: React.CSSProperties
}) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <g fill="currentColor" fillRule="nonzero">
      <path d="M24 24H10.8V13.2H0v-2.4h13.2v10.8H24z" />
      <path d="M15.84 10.8h2.4v5.107h3.293V10.8h2.4v7.507H15.84zM8.093 8.093H0V0h8.093v8.093zM2.4 5.693h3.293V2.4H2.4v3.293zM24 8.093h-8.093V0H24v8.093zm-5.693-2.4H21.6V2.4h-3.293v3.293zM8.093 24H0v-8.093h8.093V24zM2.4 21.6h3.293v-3.293H2.4V21.6zM10.8 0h2.4v8.093h-2.4z" />
    </g>
  </SvgIcon>
)

export default QRCodeIcon

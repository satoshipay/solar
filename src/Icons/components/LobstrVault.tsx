import * as React from "react"
import SvgIcon from "@material-ui/core/SvgIcon"

function LobstrVaultIcon(props: {
  className?: string
  onClick?: () => void
  role?: string
  style?: React.CSSProperties
}) {
  return (
    <SvgIcon viewBox="0 0 67 96" {...props}>
      <defs>
        <linearGradient id="linearGradient-1" x1="74.917%" x2="0%" y1="62.329%" y2="37.418%">
          <stop offset="0%"></stop>
          <stop offset="100%" stopColor="#090114" stopOpacity="0"></stop>
        </linearGradient>
        <linearGradient id="linearGradient-2" x1="74.917%" x2="0%" y1="88.177%" y2="11.038%">
          <stop offset="0%"></stop>
          <stop offset="100%" stopColor="#090114" stopOpacity="0"></stop>
        </linearGradient>
      </defs>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(-28 -13)">
          <g transform="translate(28.467 13.217)">
            <path
              fill="url(#linearGradient-1)"
              fillOpacity="0.31"
              d="M49.081 26.925C48.876 14.83 43.518 8.783 33.008 8.783c-10.51 0-15.846 6.047-16.006 18.142 1.795-10.747 7.13-16.12 16.006-16.12 8.875 0 14.233 5.373 16.073 16.12z"
              opacity="0.8"
            ></path>
            <path
              fill="currentColor"
              d="M7.822 37.256c-.069-.847.03-.139 0-.71C6.562 12.183 14.968 0 33.042 0c17.906 0 26.323 11.958 25.252 35.875-.063 1.391-.157-.092-.284 1.38m-41.102 0c-.115-1.876-.185-.345-.21-1.234-.502-17.976 4.946-26.964 16.344-26.964 11.436 0 16.882 9.048 16.338 27.145-.038 1.277-.107-.315-.205 1.054"
              opacity="0.9"
            ></path>
            <path
              fill="url(#linearGradient-2)"
              fillOpacity="0.31"
              d="M7.566 81.078C4.074 77.425.873 73.968.265 65.39c-.353-4.985-.353-14.36 0-28.128l32.777-7.457 32.776 7.457c.354 13.767.354 23.143 0 28.128-.608 8.58-3.809 12.036-7.3 15.69-4.573 4.784-13.065 9.613-25.476 14.488-12.411-4.875-20.903-9.704-25.476-14.489z"
              opacity="0.8"
            ></path>
            <path
              fill="currentColor"
              d="M7.566 78.552C4.074 75.08.873 71.793.265 63.636c-.353-4.739-.353-13.653 0-26.742l32.777-7.09 32.776 7.09c.354 13.089.354 22.003 0 26.742-.584 7.844-3.566 11.183-6.899 14.516l-.401.4c-4.573 4.55-13.065 9.14-25.476 13.775-12.411-4.634-20.903-9.226-25.476-13.775z"
              opacity="0.8"
            ></path>
            <path
              fill="currentColor"
              d="M33.042 29.804l32.776 7.09c.354 13.089.354 22.003 0 26.742-.608 8.157-3.809 11.443-7.3 14.916-4.573 4.55-13.065 9.14-25.476 13.775V29.804z"
              opacity="0.5"
            ></path>
            <path
              fill="currentColor"
              d="M33.0416667 29.8038418L33.0416667 34.9796962 -4.97379915e-14 41.6836021 0.0925333327 36.881422z"
              opacity="0.9"
            ></path>
            <path
              fill="currentColor"
              d="M65.9334084 29.8038418L65.9334084 34.9796962 33.0416667 41.6836021 33.148808 36.8893969z"
              opacity="0.9"
              transform="matrix(-1 0 0 1 98.975 0)"
            ></path>
          </g>
        </g>
      </g>
    </SvgIcon>
  )
}

export default LobstrVaultIcon

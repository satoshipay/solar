import * as React from "react"
import SvgIcon from "@material-ui/core/SvgIcon"

function LobstrVaultIcon(props: {
  className?: string
  onClick?: () => void
  role?: string
  style?: React.CSSProperties
}) {
  return (
    <SvgIcon viewBox="0 0 129 129" {...props}>
      <defs>
        <linearGradient id="c" x1="81.523%" x2="14.838%" y1="19.257%" y2="100%">
          <stop offset="0%" stopColor="#5116A4"></stop>
          <stop offset="100%" stopColor="#9668FF"></stop>
        </linearGradient>
        <linearGradient id="d" x1="29.565%" x2="59.172%" y1="22.343%" y2="65.563%">
          <stop offset="0%" stopColor="#FBF8FF"></stop>
          <stop offset="100%" stopColor="#D0B1FF"></stop>
        </linearGradient>
        <linearGradient id="e" x1="74.917%" x2="0%" y1="88.177%" y2="11.038%">
          <stop offset="0%"></stop>
          <stop offset="100%" stopColor="#090114" stopOpacity="0"></stop>
        </linearGradient>
        <linearGradient id="f" x1="50%" x2="50%" y1="-10.027%" y2="10.132%">
          <stop offset="0%" stopColor="#EEE"></stop>
          <stop offset="100%" stopColor="#DAC1FF"></stop>
        </linearGradient>
        <linearGradient id="g" x1="0%" x2="50%" y1="42.075%" y2="42.075%">
          <stop offset="0%" stopColor="#FFF"></stop>
          <stop offset="100%" stopColor="#DBC3FF"></stop>
        </linearGradient>
        <linearGradient id="h" x1="36.036%" x2="63.964%" y1="100%" y2="42.066%">
          <stop offset="0%" stopColor="#B27EFF"></stop>
          <stop offset="100%" stopColor="#B482FF"></stop>
        </linearGradient>
        <linearGradient id="i" x1="0%" x2="50%" y1="42.075%" y2="42.075%">
          <stop offset="0%" stopColor="#FFF"></stop>
          <stop offset="100%" stopColor="#E8D8FF"></stop>
        </linearGradient>
        <linearGradient id="j" x1="0%" y1="53.823%" y2="46.959%">
          <stop offset="0%" stopColor="#C7A1FF"></stop>
          <stop offset="100%" stopColor="#BE92FF"></stop>
        </linearGradient>
        <path
          id="a"
          d="M44.975 0h39.05c12.95 0 19.424 0 26.396 2.204a27.397 27.397 0 0116.375 16.375C129 25.55 129 32.025 129 44.975v39.05c0 12.95 0 19.424-2.204 26.396a27.393 27.393 0 01-16.375 16.374C103.449 129 96.976 129 84.025 129h-39.05c-12.95 0-19.425 0-26.396-2.205a27.393 27.393 0 01-16.375-16.374C0 103.449 0 96.976 0 84.025v-39.05c0-12.95 0-19.425 2.204-26.396A27.397 27.397 0 0118.579 2.204C25.55 0 32.024 0 44.975 0"
        ></path>
      </defs>
      <g fill="none" fillRule="evenodd">
        <mask id="b" fill="#fff">
          <use xlinkHref="#a"></use>
        </mask>
        <use fill="#D6D6D6" xlinkHref="#a"></use>
        <g mask="url(#b)">
          <path fill="url(#c)" d="M0 0h129v129H0z"></path>
          <path
            fill="url(#d)"
            d="M51.997 42.475c1.573-21.932-4.114-32.899-17.06-32.899-12.945 0-18.632 10.967-17.059 32.9H8.536C6.102 14.157 14.902 0 34.937 0 54.974 0 63.773 14.158 61.34 42.475h-9.342z"
            transform="translate(30.1 13.975)"
          ></path>
          <path
            fill="url(#e)"
            fillOpacity="0.31"
            d="M34.938 31.514l34.657 7.885c.373 14.557.373 24.471 0 29.742-.643 9.072-4.028 12.726-7.72 16.59-4.835 5.058-13.814 10.165-26.938 15.319C21.815 95.896 12.835 90.79 8 85.73 4.308 81.867.923 78.213.28 69.141c-.373-5.27-.373-15.185 0-29.742l34.657-7.885z"
            transform="translate(30.1 13.975)"
          ></path>
          <path
            fill="url(#f)"
            d="M51.897 28.431C51.68 15.643 46.015 9.249 34.902 9.249c-11.114 0-16.755 6.394-16.924 19.182 1.898-11.363 7.539-17.044 16.924-17.044 9.384 0 15.05 5.681 16.995 17.044z"
            transform="translate(30.1 13.975)"
          ></path>
          <path
            fill="url(#g)"
            d="M34.938 31.514l34.657 7.497c.373 13.84.373 23.265 0 28.277-.643 8.625-4.028 12.099-7.72 15.771-4.835 4.81-13.814 9.665-26.938 14.566C21.815 92.725 12.835 87.869 8 83.059 4.308 79.387.923 75.913.28 67.288c-.373-5.012-.373-14.437 0-28.277l34.657-7.497z"
            transform="translate(30.1 13.975)"
          ></path>
          <path
            fill="url(#h)"
            d="M34.938 31.514l34.657 7.497c.373 13.84.373 23.265 0 28.277-.643 8.625-4.028 12.099-7.72 15.771-4.835 4.81-13.814 9.665-26.938 14.566V31.514z"
            transform="translate(30.1 13.975)"
          ></path>
          <path fill="url(#i)" d="M34.77 31.514V37L0 44.075l.098-5.077z" transform="translate(30.1 13.975)"></path>
          <path
            fill="url(#j)"
            d="M69.716 31.514v5.473l-34.778 7.088.113-5.069z"
            transform="matrix(-1 0 0 1 134.754 13.975)"
          ></path>
        </g>
      </g>
    </SvgIcon>
  )
}

export default LobstrVaultIcon

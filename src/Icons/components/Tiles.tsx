import React from "react"

const TilesIcon = (props: { className?: string; style?: React.CSSProperties }) => (
  <svg className={props.className} viewBox="0 0 24 24" style={{ width: "1em", height: "1em", ...props.style }}>
    <path
      d="M1.846 0h6.308C9.174 0 10 .827 10 1.846v6.308C10 9.174 9.173 10 8.154 10H1.846A1.846 1.846 0 0 1 0 8.154V1.846C0 .826.827 0 1.846 0zm0 14h6.308c1.02 0 1.846.827 1.846 1.846v6.308C10 23.174 9.173 24 8.154 24H1.846A1.846 1.846 0 0 1 0 22.154v-6.308C0 14.826.827 14 1.846 14zm14-14h6.308C23.174 0 24 .827 24 1.846v6.308C24 9.174 23.173 10 22.154 10h-6.308A1.846 1.846 0 0 1 14 8.154V1.846C14 .826 14.827 0 15.846 0zm0 14h6.308c1.02 0 1.846.827 1.846 1.846v6.308c0 1.02-.827 1.846-1.846 1.846h-6.308A1.846 1.846 0 0 1 14 22.154v-6.308c0-1.02.827-1.846 1.846-1.846z"
      fill="#FFF"
      fillRule="nonzero"
    />
  </svg>
)

export default TilesIcon

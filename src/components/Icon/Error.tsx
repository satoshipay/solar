import React from "react"
import "./animated-icons.css"

// From <https://github.com/Kamonlojn/svg-icons-animate>
// TODO: Crop SVGs to remove surrounding whitespace

const AnimatedErrorIcon = ({ size = 100 }) => (
  <div className="svg-box-u5GqHV" style={{ width: size, height: size }}>
    <svg className="red-stroke-u5GqHV" viewBox="0 0 150 150">
      <circle className="circular-u5GqHV" cx="75" cy="75" r="50" fill="none" strokeWidth="5" strokeMiterlimit="10" />
    </svg>
    <svg className="cross-u5GqHV red-stroke-u5GqHV" viewBox="0 0 150 150">
      <g transform="translate(54, 54)">
        <g transform="matrix(0.79961,8.65821e-32,8.39584e-32,0.79961,-502.652,-204.518)">
          <path className="cross-first-line-u5GqHV" d="M634.087,300.805L673.361,261.53" fill="none" />
        </g>
        <g transform="matrix(-1.28587e-16,-0.79961,0.79961,-1.28587e-16,-204.752,543.031)">
          <path className="cross-second-line-u5GqHV" d="M634.087,300.805L673.361,261.53" />
        </g>
      </g>
    </svg>
  </div>
)

export default AnimatedErrorIcon

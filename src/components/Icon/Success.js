import React from 'react'
import './animated-icons.css'

// From <https://github.com/Kamonlojn/svg-icons-animate>

const AnimatedSuccessIcon = ({ size = 100 }) => (
  <div className='svg-box-u5GqHV' style={{ width: size, height: size }}>
    <svg className='green-stroke-u5GqHV' viewBox='0 0 150 150'>
      <circle className='circular-u5GqHV' cx='75' cy='75' r='50' fill='none' strokeWidth='5' strokeMiterlimit='10' />
    </svg>
    <svg className='checkmark-u5GqHV green-stroke-u5GqHV' viewBox='0 0 150 150'>
      <g transform='translate(49, 56)'>
        <g transform='matrix(0.79961,8.65821e-32,8.39584e-32,0.79961,-489.57,-205.679)'>
          <path className='checkmark-check-u5GqHV' fill='none' d='M616.306,283.025L634.087,300.805L673.361,261.53' />
        </g>
      </g>
    </svg>
  </div>
)

export default AnimatedSuccessIcon

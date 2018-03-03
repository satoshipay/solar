import React from 'react'
import './animated-icons.css'

const AnimatedSuccessIcon = ({ size = 100 }) => (
  <div className='svg-box' style={{ width: size, height: size }}>
    <svg className='green-stroke' viewBox='0 0 150 150'>
      <circle className='circular' cx='75' cy='75' r='50' fill='none' strokeWidth='5' strokeMiterlimit='10' />
    </svg>
    <svg className='checkmark green-stroke' viewBox='0 0 150 150'>
      <g transform='translate(49, 56)'>
        <g transform='matrix(0.79961,8.65821e-32,8.39584e-32,0.79961,-489.57,-205.679)'>
          <path className='checkmark__check' fill='none' d='M616.306,283.025L634.087,300.805L673.361,261.53' />
        </g>
      </g>
    </svg>
  </div>
)

export default AnimatedSuccessIcon

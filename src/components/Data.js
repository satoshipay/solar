import React from 'react'

export const DetailData = ({ label, value }) => (
  <div>
    <small style={{ display: 'block', fontSize: '75%', opacity: 0.8, lineHeight: 'normal' }}>{label}</small>
    <div>{value}</div>
  </div>
)

export const DetailDataSet = ({ children }) => (
  <div>
    {React.Children.map(children, (child, index) => (
      <div style={{ marginTop: (index === 0 ? 0 : 12) }}>{child}</div>
    ))}
  </div>
)

import React from "react"

export const DetailData = (props: { label: string; value: React.ReactNode }) => (
  <div>
    <small
      style={{
        display: "block",
        fontSize: "75%",
        opacity: 0.8,
        lineHeight: "normal"
      }}
    >
      {props.label}
    </small>
    <div>{props.value}</div>
  </div>
)

export const DetailDataSet = (props: { children: React.ReactNode }) => (
  <div>
    {React.Children.map(props.children, (child, index) => (
      <div style={{ marginTop: index === 0 ? 0 : 12 }}>{child}</div>
    ))}
  </div>
)

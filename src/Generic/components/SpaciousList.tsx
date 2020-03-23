import React from "react"
import Divider from "@material-ui/core/Divider"
import List, { ListProps } from "@material-ui/core/List"

type Props = ListProps & {
  fitHorizontal?: boolean
}

const SpaciousList = (props: Props) => {
  const { fitHorizontal = false, ...listProps } = props
  const children = React.Children.toArray(props.children).filter(child => child !== null)
  const dividerStyle: React.CSSProperties = {
    margin: "1em 0",
    marginLeft: fitHorizontal ? 24 : 0
  }
  const style: React.CSSProperties = {
    ...props.style,
    ...(fitHorizontal
      ? {
          marginLeft: -24
        }
      : {})
  }
  return (
    <List {...listProps} style={style}>
      {children.map((child, index) => (
        <React.Fragment key={index}>
          {index === 0 ? null : <Divider style={dividerStyle} />}
          {child}
        </React.Fragment>
      ))}
    </List>
  )
}

export default SpaciousList

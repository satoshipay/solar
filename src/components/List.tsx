import React from 'react'
import {
  List as MaterialList,
  ListItem as MaterialListItem
} from 'material-ui/List'

const noop = () => {}

const IconDiv = (props: { children: React.ReactNode }) => {
  const marginSize = 12
  return <div style={{ flexGrow: 0, flexShrink: 0, marginRight: marginSize }}>{props.children}</div>
}

type ListItemProps = {
  primaryText: React.ReactNode,
  secondaryText?: React.ReactNode | null,
  heading?: React.ReactNode | null,
  leftIcon?: React.ReactNode | null,
  rightIcon?: React.ReactNode | null,
  onClick?: React.MouseEventHandler<{}>
}

const ListItem = (props: ListItemProps) => {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center' }}>
      {props.leftIcon ? <IconDiv>{props.leftIcon}</IconDiv> : null}
      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
        {props.heading ? <div>{props.heading}</div> : null}
        <div>{props.primaryText}</div>
        {props.secondaryText ? <div>{props.secondaryText}</div> : null}
      </div>
      {props.rightIcon ? <IconDiv>{props.rightIcon}</IconDiv> : null}
    </div>
  )
  return <MaterialListItem primaryText={content} onClick={props.onClick || noop} disabled={!props.onClick} />
}

export {
  MaterialList as List,
  ListItem
}

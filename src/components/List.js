import React from 'react'
import {
  List as MaterialList,
  ListItem as MaterialListItem
} from 'material-ui/List'

const noop = () => {}

const ListItem = ({ primaryText, secondaryText = null, heading = null, leftIcon = null, rightIcon = null, onClick = noop }) => {
  const marginSize = 12

  const LeftIconDiv = ({ children }) => <div style={{ flexGrow: 0, flexShrink: 0, marginRight: marginSize }}>{children}</div>
  const RightIconDiv = ({ children }) => <div style={{ flexGrow: 0, flexShrink: 0, marginLeft: marginSize }}>{children}</div>

  const content = (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center' }}>
      {leftIcon ? <LeftIconDiv>{leftIcon}</LeftIconDiv> : null}
      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
        {heading ? <div>{heading}</div> : null}
        <div>{primaryText}</div>
        {secondaryText ? <div>{secondaryText}</div> : null}
      </div>
      {rightIcon ? <RightIconDiv>{rightIcon}</RightIconDiv> : null}
    </div>
  )
  return <MaterialListItem primaryText={content} onClick={onClick} disabled={onClick === noop || !onClick} />
}

export {
  MaterialList as List,
  ListItem
}

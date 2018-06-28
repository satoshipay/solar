import React from 'react'

interface AnchorRenderPropArgument {
  onOpen: (event: React.SyntheticEvent<HTMLElement>) => void
}

interface MenuRenderPropArgument {
  anchorEl: HTMLElement | null,
  open: boolean,
  onClose: () => void
}

interface Props {
  anchor: (anchorProps: AnchorRenderPropArgument) => React.ReactNode,
  menu: (menuProps: MenuRenderPropArgument) => React.ReactNode
}

interface State {
  anchorEl: HTMLElement | null,
  open: boolean
}

class ContextMenu extends React.Component<Props, State> {
  state = {
    anchorEl: null,
    open: false
  }

  show = (event: React.SyntheticEvent<HTMLElement>) => {
    this.setState({ anchorEl: event.currentTarget, open: true })
  }

  hide = () => {
    this.setState({ open: false })
  }

  render () {
    const { anchor, menu } = this.props

    return (
      <>
         {anchor({ onOpen: this.show })}
         {menu({ anchorEl: this.state.anchorEl, open: this.state.open, onClose: this.hide })}
      </>
    )
  }
}

export default ContextMenu

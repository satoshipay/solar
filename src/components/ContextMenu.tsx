import React from "react"

export interface AnchorRenderProps {
  onOpen: (event: React.SyntheticEvent<HTMLElement>) => void
}

interface MenuRenderProps {
  anchorEl: HTMLElement | null
  closeAndCall: (fn: () => void) => () => void
  open: boolean
  onClose: () => void
}

interface Props {
  anchor: (anchorProps: AnchorRenderProps) => React.ReactNode
  menu: (menuProps: MenuRenderProps) => React.ReactNode
}

interface State {
  anchorEl: HTMLElement | null
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

  closeAndCall = (fn: () => void) => {
    return () => {
      this.hide()
      fn()
    }
  }

  render() {
    const { anchor, menu } = this.props

    return (
      <>
        {anchor({ onOpen: this.show })}
        {menu({
          anchorEl: this.state.anchorEl,
          open: this.state.open,
          onClose: this.hide,
          closeAndCall: this.closeAndCall
        })}
      </>
    )
  }
}

export default ContextMenu

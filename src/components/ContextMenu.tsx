import React from "react"

export interface AnchorRenderProps {
  onOpen: (event: React.SyntheticEvent<HTMLElement>) => void
}

interface MenuRenderProps {
  anchorEl: HTMLElement | null
  closeAndCall: (fn: (() => void) | undefined) => () => void
  open: boolean
  onClose: () => void
}

interface Props {
  anchor: (anchorProps: AnchorRenderProps) => React.ReactNode
  menu: (menuProps: MenuRenderProps) => React.ReactNode
}

function ContextMenu({ anchor, menu }: Props) {
  const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null)
  const [isOpen, setOpenState] = React.useState(false)

  const show = (event: React.SyntheticEvent<HTMLElement>) => {
    setAnchorElement(event.currentTarget)
    setOpenState(true)
  }
  const hide = () => setOpenState(false)

  const closeAndCall = (fn?: () => void) => {
    return () => {
      hide()
      if (fn) {
        fn()
      }
    }
  }

  return (
    <>
      {anchor({ onOpen: show })}
      {menu({
        anchorEl: anchorElement,
        open: isOpen,
        onClose: hide,
        closeAndCall
      })}
    </>
  )
}

export default ContextMenu

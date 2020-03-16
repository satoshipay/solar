import React from "react"
import AddIcon from "@material-ui/icons/Add"
import RemoveIcon from "@material-ui/icons/Remove"
import MainSelectionButton from "../Form/MainSelectionButton"
import { HorizontalLayout } from "../Layout/Box"

interface Props {
  onSelectBuy: () => void
  onSelectSell: () => void
  style?: React.CSSProperties
}

const MainActionSelection = React.forwardRef(function MainActionSelection(
  props: Props,
  ref: React.Ref<HTMLDivElement>
) {
  return (
    <HorizontalLayout ref={ref} justifyContent="space-evenly" margin="48px 0 24px" padding="0 8px" wrap="wrap">
      <MainSelectionButton
        label="Buy asset"
        description={"Buy some amount of an asset on the distributed exchange"}
        gutterBottom
        onClick={props.onSelectBuy}
        Icon={AddIcon}
      />
      <MainSelectionButton
        label="Sell asset"
        description={"Trade some amount of an asset for another one"}
        gutterBottom
        onClick={props.onSelectSell}
        Icon={RemoveIcon}
      />
    </HorizontalLayout>
  )
})

export default React.memo(MainActionSelection)

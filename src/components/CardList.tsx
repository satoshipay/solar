import React from "react"
import Card from "@material-ui/core/Card"
import withStyles, { StyleRules } from "@material-ui/core/styles/withStyles"
import { HorizontalLayout } from "./Layout/Box"

const cardStyles: StyleRules = {
  root: {
    width: "47%",
    minWidth: 250,
    maxWidth: 500,
    flexGrow: 1,
    margin: "12px 1%",
    borderRadius: 8
  }
}

export const CardListCard = withStyles(cardStyles)(Card)

interface CardListProps {
  addInvisibleCard?: boolean
  children: React.ReactNode
}

export const CardList = (props: CardListProps) => {
  return (
    <HorizontalLayout justifyContent="space-evenly" wrap="wrap" margin="0 -1%" width="102%">
      {props.children}
      {props.addInvisibleCard ? <CardListCard style={{ visibility: "hidden" }} /> : null}
    </HorizontalLayout>
  )
}

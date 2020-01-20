import React from "react"
import DeleteIcon from "@material-ui/icons/Delete"
import IconButton from "@material-ui/core/IconButton"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import { SettingsContext } from "../../context/settings"
import { useIsMobile } from "../../hooks/userinterface"
import { ActionButton, ConfirmDialog } from "../Dialog/Generic"
import { Address } from "../PublicKey"

const isMobileDevice = process.env.PLATFORM === "android" || process.env.PLATFORM === "ios"

function TrustedServiceList() {
  const { setSetting, trustedServices } = React.useContext(SettingsContext)
  const [confirmationPending, setConfirmationPending] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)

  const onDelete = () => {
    const selectedService = trustedServices[selectedIndex]
    if (!selectedService) {
      return
    }

    const newTrustedServices = trustedServices.filter(service => service.domain !== selectedService.domain)
    setSetting("trustedServices", newTrustedServices)
  }

  const onConfirm = () => {
    setConfirmationPending(false)
    setSelectedIndex(-1)
    onDelete()
  }

  return (
    <>
      <List style={{ background: "transparent", paddingLeft: 0, paddingRight: 0 }}>
        {trustedServices.map((service, index) => (
          <TrustedServiceListItem
            index={index}
            key={service.domain}
            onDeleteClick={() => {
              setSelectedIndex(index)
              setConfirmationPending(true)
            }}
            trustedService={service}
          />
        ))}
        {trustedServices.length === 0 ? (
          <Typography style={{ opacity: 0.7, textAlign: "center" }}>(No trusted services)</Typography>
        ) : null}
      </List>
      <ConfirmDialog
        cancelButton={<ActionButton onClick={() => setConfirmationPending(false)}>Cancel</ActionButton>}
        confirmButton={
          <ActionButton onClick={onConfirm} type="primary">
            Confirm
          </ActionButton>
        }
        open={confirmationPending}
        onClose={() => setConfirmationPending(false)}
        title="Confirm removal"
      >
        The service will be removed from your trust list. Are you sure?
      </ConfirmDialog>
    </>
  )
}

const useTrustedServiceListItemStyles = makeStyles({
  listItem: {
    background: "#FFFFFF",
    boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
    "&:focus": {
      backgroundColor: "#FFFFFF"
    },
    "&:hover": {
      backgroundColor: isMobileDevice ? "#FFFFFF" : "rgb(232, 232, 232)"
    }
  }
})

interface TrustedServiceListItemProps {
  index: number
  onClick?: (event: React.MouseEvent, index: number) => void
  onDeleteClick?: (event: React.MouseEvent, index: number) => void
  trustedService: TrustedService
  style?: React.CSSProperties
}

const TrustedServiceListItem = React.memo(function TrustedServiceListItem(props: TrustedServiceListItemProps) {
  const classes = useTrustedServiceListItemStyles()
  const isSmallScreen = useIsMobile()

  return (
    <ListItem button className={classes.listItem} onClick={event => props.onClick && props.onClick(event, props.index)}>
      <ListItemIcon style={{ marginRight: 0 }}>
        <div />
      </ListItemIcon>
      <ListItemText
        primary={props.trustedService.domain}
        secondary={<Address address={props.trustedService.signingKey} variant={isSmallScreen ? "short" : "full"} />}
      />
      <ListItemIcon style={{ marginRight: 0 }}>
        <IconButton onClick={event => props.onDeleteClick && props.onDeleteClick(event, props.index)}>
          <DeleteIcon />
        </IconButton>
      </ListItemIcon>
    </ListItem>
  )
} as React.ComponentType<TrustedServiceListItemProps>)

export default TrustedServiceList

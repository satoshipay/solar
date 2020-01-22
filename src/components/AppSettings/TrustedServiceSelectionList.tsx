import React from "react"
import Avatar from "@material-ui/core/Avatar"
import CloudIcon from "@material-ui/icons/Cloud"
import RemoveIcon from "@material-ui/icons/RemoveCircle"
import IconButton from "@material-ui/core/IconButton"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import { SettingsContext } from "../../context/settings"
import { useStellarToml } from "../../hooks/stellar"
import { ActionButton, ConfirmDialog } from "../Dialog/Generic"

const useTrustedServiceListStyles = makeStyles({
  list: {
    background: "transparent",
    paddingBottom: 16
  },
  typography: {
    opacity: 0.7,
    textAlign: "center"
  }
})

function TrustedServiceList() {
  const classes = useTrustedServiceListStyles()

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
      <List className={classes.list}>
        {trustedServices
          .sort((a, b) => a.domain.localeCompare(b.domain))
          .map((service, index) => (
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
          <Typography className={classes.typography}>(No trusted services)</Typography>
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
    boxShadow: "0 8px 12px 0 rgba(0, 0, 0, 0.1)",
    "&:first-child": {
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8
    },
    "&:last-child": {
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8
    }
  },
  cloudAvatar: {
    backgroundColor: "rgba(0, 0, 0, 0.54)"
  },
  logoAvatar: {
    backgroundColor: "white"
  }
})

interface TrustedServiceListItemProps {
  index: number
  onDeleteClick?: (event: React.MouseEvent, index: number) => void
  trustedService: TrustedService
  style?: React.CSSProperties
}

const TrustedServiceListItem = React.memo(function TrustedServiceListItem(props: TrustedServiceListItemProps) {
  const classes = useTrustedServiceListItemStyles()

  const stellarToml = useStellarToml(props.trustedService.domain)
  const imageURL = stellarToml && stellarToml.DOCUMENTATION && stellarToml.DOCUMENTATION.ORG_LOGO
  const orgName = stellarToml && stellarToml.DOCUMENTATION && stellarToml.DOCUMENTATION.ORG_NAME

  return (
    <ListItem className={classes.listItem}>
      <ListItemIcon style={{ marginRight: 0 }}>
        {imageURL ? (
          <Avatar alt={name} className={classes.logoAvatar} src={imageURL} />
        ) : (
          <Avatar alt={name} className={classes.cloudAvatar}>
            <CloudIcon />
          </Avatar>
        )}
      </ListItemIcon>
      <ListItemText primary={orgName ? orgName : props.trustedService.domain} secondary={props.trustedService.domain} />
      <ListItemIcon style={{ marginRight: 0 }}>
        <IconButton onClick={event => props.onDeleteClick && props.onDeleteClick(event, props.index)}>
          <RemoveIcon />
        </IconButton>
      </ListItemIcon>
    </ListItem>
  )
} as React.ComponentType<TrustedServiceListItemProps>)

export default TrustedServiceList

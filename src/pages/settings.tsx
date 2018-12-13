import React from "react"
import { withRouter, RouteComponentProps } from "react-router"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import BackButton from "../components/BackButton"
import { Box, HorizontalLayout, VerticalLayout } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import Settings from "../components/Settings"
import * as routes from "../routes"

type Props = RouteComponentProps<any, any, any>

// tslint:disable-next-line
const pkg = require("../../package.json")

class SettingsPage extends React.Component<Props> {
  render() {
    return (
      <>
        <Section top brandColored style={{ flexGrow: 0 }}>
          <Card
            style={{
              position: "relative",
              background: "transparent",
              boxShadow: "none"
            }}
          >
            <CardContent style={{ paddingTop: 16, paddingBottom: 16 }}>
              <HorizontalLayout alignItems="center" margin="-12px 0 -10px" minHeight={56}>
                <BackButton
                  onClick={() => this.props.history.push(routes.allAccounts())}
                  style={{ marginLeft: -10, marginRight: 10 }}
                />
                <Typography
                  align="center"
                  color="inherit"
                  variant="headline"
                  component="h2"
                  style={{ marginRight: 20 }}
                >
                  Settings
                </Typography>
              </HorizontalLayout>
            </CardContent>
          </Card>
        </Section>
        <Section style={{ display: "flex", flexDirection: "column" }}>
          <VerticalLayout height="100%" padding="0 8px" grow>
            <Box grow>
              <Settings />
            </Box>
            <Box grow={0} margin="16px 0 0">
              <Typography align="center" color="textSecondary">
                v{pkg.version}
              </Typography>
            </Box>
          </VerticalLayout>
        </Section>
      </>
    )
  }
}

export default withRouter(SettingsPage)

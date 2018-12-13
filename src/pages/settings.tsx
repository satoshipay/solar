import React from "react"
import { withRouter, RouteComponentProps } from "react-router"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import BackButton from "../components/BackButton"
import { HorizontalLayout } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import Settings from "../components/Settings"
import * as routes from "../routes"

type Props = RouteComponentProps<any, any, any>

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
        <Section>
          <div style={{ padding: "0 8px" }}>
            <Settings />
          </div>
        </Section>
      </>
    )
  }
}

export default withRouter(SettingsPage)

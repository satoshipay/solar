import { addDecorator, configure } from "@storybook/react"
import centered from "@storybook/addon-centered"
import "storybook-addon-material-ui/register"
import { muiTheme } from "storybook-addon-material-ui"
import theme from "../src/theme"

function loadStories() {
  require("../stories/index")
}

addDecorator(centered)
addDecorator(muiTheme([theme]))
configure(loadStories, module)

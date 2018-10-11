import { createMuiTheme } from "@material-ui/core/styles"
import indigo from "@material-ui/core/colors/indigo"
import lightBlue from "@material-ui/core/colors/lightBlue"

export const brandColor = indigo[500]

const theme = createMuiTheme({
  overrides: {
    MuiFormLabel: {
      focused: {
        color: "inherit !important"
      }
    },
    MuiLinearProgress: {
      colorPrimary: {
        backgroundColor: lightBlue["100"]
      },
      barColorPrimary: {
        backgroundColor: lightBlue.A200
      }
    }
  },
  palette: {
    primary: {
      ...indigo,
      contrastText: "white"
    }
  }
})

export default theme

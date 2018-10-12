import { createMuiTheme } from "@material-ui/core/styles"
import grey from "@material-ui/core/colors/grey"
import indigo from "@material-ui/core/colors/indigo"
import lightBlue from "@material-ui/core/colors/lightBlue"

export const brandColor = indigo[500]

const theme = createMuiTheme({
  overrides: {
    MuiButton: {
      root: {
        borderRadius: 3
      },
      contained: {
        backgroundColor: "white",
        border: `1px solid ${grey["400"]}`,
        boxShadow: "none"
      }
    },
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

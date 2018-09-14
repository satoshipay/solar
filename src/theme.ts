import { createMuiTheme } from "@material-ui/core/styles"
import indigo from "@material-ui/core/colors/indigo"

const theme = createMuiTheme({
  overrides: {
    MuiFormLabel: {
      focused: {
        color: "inherit !important"
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

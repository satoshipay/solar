import { createMuiTheme } from "@material-ui/core/styles"
import grey from "@material-ui/core/colors/grey"
import lightBlue from "@material-ui/core/colors/lightBlue"

// TODO: The dark and light derivation of the brand color have not been design-reviewed!
export const brandColor = {
  dark: "#0290c0",
  main: "#02b8f5",
  light: "#72dbfe"
}

export const primaryBackground = "linear-gradient(to left bottom, #01B3F3, #0176DC)"

const theme = createMuiTheme({
  overrides: {
    MuiBottomNavigationAction: {
      selected: {
        color: `${brandColor.dark} !important`
      }
    },
    MuiButton: {
      root: {
        borderRadius: 3
      },
      contained: {
        backgroundColor: "white",
        border: `1px solid ${grey["400"]}`,
        boxShadow: "none",
        color: brandColor.dark
      },
      containedPrimary: {
        borderColor: grey["200"]
      },
      flatPrimary: {
        color: brandColor.dark
      },
      raisedPrimary: {}
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
    },
    MuiListSubheader: {
      sticky: {
        background: "linear-gradient(to bottom, white 0%, white 70%, rgba(255, 255, 255, 0) 100%)"
      }
    }
  },
  palette: {
    primary: {
      ...brandColor,
      contrastText: "white"
    }
  }
})

export default theme

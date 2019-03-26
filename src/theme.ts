import { createMuiTheme } from "@material-ui/core/styles"
import amber from "@material-ui/core/colors/amber"
import grey from "@material-ui/core/colors/grey"
import lightBlue from "@material-ui/core/colors/lightBlue"

// TODO: The dark and light derivation of the brand color have not been design-reviewed!
export const brandColor = {
  dark: "#0290c0",
  main: "#02b8f5",
  main15: "#02b8f526",
  light: "#72dbfe"
}

export const primaryBackground = "linear-gradient(to left bottom, #01B3F3, #0176DC)"
export const primaryBackgroundColor = "#0194E7"

export const warningColor = amber["500"]

const theme = createMuiTheme({
  props: {
    MuiInputLabel: {
      shrink: true
    }
  },
  overrides: {
    MuiButton: {
      root: {
        borderRadius: 3
      },
      contained: {
        backgroundColor: "white",
        border: `1px solid ${grey["400"]}`,
        boxShadow: "none",
        color: brandColor.dark,
        "&$disabled": {
          borderColor: "rgba(128, 128, 128, 0.5)"
        }
      },
      containedPrimary: {
        borderColor: grey["200"],
        "&$disabled": {
          borderColor: "rgba(64, 64, 64, 0.5)"
        }
      },
      flatPrimary: {
        color: brandColor.dark
      },
      outlinedSecondary: {
        borderColor: "rgba(255, 255, 255, 0.87)",
        color: "white",
        "&:hover": {
          borderColor: "white"
        }
      },
      raisedPrimary: {}
    },
    MuiFormLabel: {
      root: {
        "&$focused": {
          color: "inherit !important"
        }
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
      contrastText: "white",
      dark: brandColor.dark,
      main: brandColor.main,
      light: brandColor.light
    }
  },
  typography: {
    useNextVariants: true
  }
})

export default theme

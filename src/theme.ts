import { createMuiTheme } from "@material-ui/core/styles"
import createBreakpoints from "@material-ui/core/styles/createBreakpoints"
import amber from "@material-ui/core/colors/amber"
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

const breakpoints = createBreakpoints({})

const theme = createMuiTheme({
  props: {
    MuiInputLabel: {
      shrink: true
    }
  },
  overrides: {
    MuiButton: {
      root: {
        borderRadius: 3,
        boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
        [breakpoints.up(600)]: {
          minHeight: 48
        },
        [breakpoints.down(600)]: {
          minHeight: 36
        }
      },
      contained: {
        backgroundColor: "white",
        boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
        border: `none`,
        color: brandColor.dark
      },
      containedPrimary: {
        "&$disabled": {
          backgroundColor: brandColor.main,
          border: "none",
          boxShadow: "none",
          color: "rgba(255, 255, 255, 0.7)"
        }
      },
      flatPrimary: {
        color: brandColor.dark
      },
      outlinedSecondary: {
        backgroundColor: "transparent",
        borderColor: "rgba(255, 255, 255, 0.87)",
        boxShadow: "none",
        color: "white",
        "&:disabled": {
          opacity: 0.5
        },
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.10)",
          borderColor: "white"
        }
      },
      raisedPrimary: {}
    },
    MuiCardContent: {
      root: {
        [breakpoints.down(600)]: {
          padding: 8
        }
      }
    },
    MuiDialog: {
      paperFullScreen: {
        boxSizing: "border-box",
        "&": {
          // iOS 11
          paddingTop: "constant(safe-area-inset-top)",
          paddingBottom: "constant(safe-area-inset-bottom)"
        },
        // iOS 12
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)"
      }
    },
    MuiFormLabel: {
      root: {
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        "&$focused": {
          color: "inherit !important"
        }
      }
    },
    MuiInput: {
      formControl: {
        "label + &": {
          marginTop: 12
        }
      }
    },
    MuiInputBase: {
      root: {
        fontSize: 18,
        fontWeight: 300,
        [breakpoints.down(400)]: {
          fontSize: 16
        }
      }
    },
    MuiInputLabel: {
      formControl: {
        [breakpoints.down(600)]: {
          fontSize: "0.85rem"
        },
        [breakpoints.down(400)]: {
          fontSize: "0.75rem"
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
    MuiList: {
      root: {
        paddingLeft: 8,
        paddingRight: 8,
        [breakpoints.down(600)]: {
          paddingLeft: 0,
          paddingRight: 0
        }
      }
    },
    MuiListItem: {
      root: {
        [breakpoints.down(600)]: {
          paddingLeft: 8,
          paddingRight: 8
        }
      }
    },
    MuiListSubheader: {
      root: {
        [breakpoints.down(600)]: {
          paddingLeft: 8,
          paddingRight: 8
        }
      },
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

const { app, Menu } = require("electron")

function createAppMenu() {
  if (process.platform !== "darwin") {
    // We only want to add this menu on OSX (will be at the top of the window on Windows & most Linux)
    return null
  }

  const macAppMenuItem = {
    label: app.getName(),
    submenu: [{ label: "About", role: "about" }, { type: "separator" }, { label: "Quit", role: "quit" }]
  }

  const appMenu = Menu.buildFromTemplate([
    macAppMenuItem,
    {
      // We need those menu items to make the keyboard shortcuts work
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" }
      ]
    }
  ])

  return appMenu
}

module.exports = {
  createAppMenu
}

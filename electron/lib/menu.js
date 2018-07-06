const { app, Menu } = require("electron")

function createAppMenu() {
  const macAppMenuItem = {
    label: app.getName(),
    submenu: [
      { label: "About", role: "about" },
      { type: "separator" },
      { label: "Quit", role: "quit" }
    ]
  }

  const appMenu = Menu.buildFromTemplate([
    ...(process.platform === "darwin" ? [macAppMenuItem] : []),
    {
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

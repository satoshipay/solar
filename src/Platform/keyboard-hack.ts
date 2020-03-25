// this hack is necessary to prevent action buttons from being stuck in center the layout on ios
// it's based on https://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes
const styleHack = "display: 'run-in'; "

export function setupRerenderListener(elements: NodeListOf<Element>) {
  if (process.env.PLATFORM !== "ios") return

  const listener = () => {
    elements.forEach(element => {
      const currentStyle = element.getAttribute("style")
      if (currentStyle === styleHack || (currentStyle && currentStyle.startsWith(styleHack))) return

      // replace the 'display' property but keep the rest of the existing style to avoid flickering
      const tempStyle = currentStyle ? currentStyle.replace(/display:[^;]+;/, styleHack) : styleHack
      element.setAttribute("style", tempStyle)

      setTimeout(() => {
        if (currentStyle) {
          element.setAttribute("style", currentStyle)
        }
      }, 0) // timeout is important to trigger a redraw
    })
  }

  window.addEventListener("resize", listener)

  return () => window.removeEventListener("resize", listener)
}

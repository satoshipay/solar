export function joinURL(...fragments: string[]) {
  return fragments.reduce((joined, fragment) => {
    if (joined.length === 0) {
      return fragment
    } else if (joined.endsWith("/") && fragment.startsWith("/")) {
      return joined + fragment.substr(1)
    } else if (joined.endsWith("/") || fragment.startsWith("/")) {
      return joined + fragment
    } else {
      return joined + "/" + fragment
    }
  }, "")
}

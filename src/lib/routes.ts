const normalizePath = (pathname: string) =>
  pathname
    .replace(/\/+/, "/")
    .replace(/^\//, "")
    .replace(/\/$/, "")

/**
 * @param pathname      Some actual path, like `router.location.pathname`.
 * @param routepath     A route path, potentially with placeholders, like `/account/:id`.
 * @param [exactMatch]  Path must match route if set. Otherwise it's ok if the path starts with that route (prefix match).
 */
export function matchesRoute(pathname: string, routepath: string, exactMatch?: boolean) {
  const pathFragments = normalizePath(pathname).split("/")
  const routeFragments = normalizePath(routepath).split("/")

  if (exactMatch && pathFragments.length !== routeFragments.length) {
    return false
  } else if (pathFragments.length < routeFragments.length) {
    return false
  }

  for (let index = 0; index < routeFragments.length; index++) {
    const routeFragment = routeFragments[index]
    const pathFragment = pathFragments[index]

    if (routeFragment === "*" || routeFragment.charAt(0) === ":") {
      continue
    } else if (pathFragment !== routeFragment) {
      return false
    }
  }

  return true
}

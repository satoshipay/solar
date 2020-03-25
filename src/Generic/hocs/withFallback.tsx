import React from "react"

function setDisplayName(Component: React.ComponentType<any>, name: string) {
  ;(Component as any).displayName = name
}

function withFallback<Props>(
  Component: React.ComponentType<Props>,
  fallback: React.ReactNode
): React.ComponentType<Props> {
  const AugmentedComponent = (props: Props) => {
    return (
      <React.Suspense fallback={fallback || null}>
        <Component {...props} />
      </React.Suspense>
    )
  }
  setDisplayName(AugmentedComponent, `withFallback(${Component.displayName || Component.name})`)
  return AugmentedComponent
}

export default withFallback

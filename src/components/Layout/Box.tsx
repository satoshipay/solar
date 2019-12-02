import React from "react"
import createBoxStyle, { BoxStyles } from "./createBoxStyle"

type BoxProps = BoxStyles & {
  children: React.ReactNode
  className?: string
  component?: string
  onClick?: () => void
  style?: React.CSSProperties
}

const Box = React.forwardRef(function Box(props: BoxProps, ref: React.Ref<unknown>) {
  const { children, className, component, onClick, style, ...styleProps } = props
  const inlineStyle = { ...createBoxStyle(styleProps), ...style }
  const Component = ((component || "div") as any) as React.ComponentType<any>
  return (
    <Component className={className} onClick={onClick} ref={ref} style={inlineStyle}>
      {children}
    </Component>
  )
})

interface BoxLayoutProps extends BoxStyles {
  children: React.ReactNode
  className?: string
  inline?: boolean
  style?: React.CSSProperties
}

const HorizontalLayout = React.forwardRef(function HorizontalLayout(
  props: BoxLayoutProps,
  ref: React.Ref<HTMLDivElement>
) {
  const { children, className, inline, style, ...styleProps } = props
  const effectiveStyle: React.CSSProperties = {
    display: inline ? "inline-flex" : "flex",
    flexDirection: "row",
    width: "100%",
    ...createBoxStyle(styleProps),
    ...style
  }
  return (
    <div className={className} ref={ref} style={effectiveStyle}>
      {children}
    </div>
  )
})

const VerticalLayout = React.forwardRef(function VerticalLayout(props: BoxLayoutProps, ref: React.Ref<HTMLDivElement>) {
  const { children, className, inline, style, ...styleProps } = props
  const effectiveStyle: React.CSSProperties = {
    display: inline ? "inline-flex" : "flex",
    flexDirection: "column",
    ...createBoxStyle(styleProps),
    ...style
  }
  return (
    <div className={className} ref={ref} style={effectiveStyle}>
      {children}
    </div>
  )
})

function FloatingBox({ children, ...styleProps }: BoxStyles & { children: React.ReactNode }) {
  const style: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1,
    ...createBoxStyle(styleProps)
  }
  return <div style={style}>{children}</div>
}

// To circumvent TypeScript name inference bug: <https://github.com/Microsoft/TypeScript/issues/14127>
export { Box, FloatingBox, HorizontalLayout, VerticalLayout }

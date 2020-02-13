import React from "react"
import { VerticalLayout } from "../Layout/Box"

interface FormLayoutProps {
  children: React.ReactNode
  wrap?: boolean
}

function FormLayout(props: FormLayoutProps) {
  return <VerticalLayout>{props.children}</VerticalLayout>
}

export default React.memo(FormLayout)

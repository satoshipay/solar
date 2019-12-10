import React from "react"
import { props as QRReaderProps } from "react-qr-reader"
import ViewLoading from "../../components/ViewLoading"

const isFullscreenQRPreview = false

const ReactQRReader = React.lazy(() => import("react-qr-reader"))

function QRReader(props: QRReaderProps) {
  return (
    <React.Suspense fallback={<ViewLoading />}>
      <ReactQRReader {...props} />
    </React.Suspense>
  )
}

export { isFullscreenQRPreview, QRReader }

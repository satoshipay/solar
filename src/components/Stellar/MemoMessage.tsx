import React from "react"
import { Memo } from "stellar-sdk"

interface Props {
  memo: Memo
  prefix?: React.ReactNode
}

function MemoMessage({ memo, prefix = null }: Props) {
  if (!memo.value) {
    return null
  } else if (Buffer.isBuffer(memo.value)) {
    const text = memo.type === "text" ? memo.value.toString("utf8") : memo.value.toString("hex")
    return (
      <span style={{ userSelect: "text" }}>
        {prefix}
        {text}
      </span>
    )
  } else {
    return (
      <span style={{ userSelect: "text" }}>
        {prefix}
        {memo.value}
      </span>
    )
  }
}

export default React.memo(MemoMessage)

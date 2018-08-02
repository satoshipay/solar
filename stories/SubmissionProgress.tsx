import React from "react"
import { storiesOf } from "@storybook/react"
import SubmissionProgress from "../src/components/SubmissionProgress"

storiesOf("SubmissionProgress", module)
  .add("pending", () => <SubmissionProgress promise={new Promise(resolve => undefined)} />)
  .add("success", () => <SubmissionProgress promise={Promise.resolve()} />)
  .add("failed", () => <SubmissionProgress promise={Promise.reject(new Error("Test error"))} />)

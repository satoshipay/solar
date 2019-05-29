import React from "react"
import { storiesOf } from "@storybook/react"
import SubmissionProgress from "../src/components/SubmissionProgress"

storiesOf("SubmissionProgress", module)
  .add("pending", () => <SubmissionProgress type={"default"} promise={new Promise(resolve => undefined)} />)
  .add("success", () => <SubmissionProgress type={"default"} promise={Promise.resolve()} />)
  .add("success-multi-sig", () => <SubmissionProgress type={"multi-sig"} promise={Promise.resolve()} />)
  .add("success-stellarguard", () => <SubmissionProgress type={"stellarguard"} promise={Promise.resolve()} />)
  .add("failed", () => <SubmissionProgress type={"default"} promise={Promise.reject(new Error("Test error"))} />)

import React from "react"
import { storiesOf } from "@storybook/react"
import SubmissionProgress, { SubmissionType } from "../src/components/SubmissionProgress"

storiesOf("SubmissionProgress", module)
  .add("pending", () => (
    <SubmissionProgress type={SubmissionType.default} promise={new Promise(resolve => undefined)} />
  ))
  .add("success", () => <SubmissionProgress type={SubmissionType.default} promise={Promise.resolve()} />)
  .add("success-multi-sig", () => <SubmissionProgress type={SubmissionType.multisig} promise={Promise.resolve()} />)
  .add("success-stellarguard", () => (
    <SubmissionProgress type={SubmissionType.stellarguard} promise={Promise.resolve()} />
  ))
  .add("failed", () => (
    <SubmissionProgress type={SubmissionType.default} promise={Promise.reject(new Error("Test error"))} />
  ))

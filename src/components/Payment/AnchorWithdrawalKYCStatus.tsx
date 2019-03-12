import React from "react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft"
import { WithdrawalKYCStatusResponse } from "@satoshipay/sep-6"
import ButtonIconLabel from "../ButtonIconLabel"
import { Box, VerticalLayout } from "../Layout/Box"
import { formatDuration } from "./formatters"

function mapTo<Value extends string, Output>(value: Value, mapping: { [input in Value]: Output }): Output {
  if (value in mapping) {
    return mapping[value]
  } else {
    throw new Error(`Encountered unexpected value: ${value}`)
  }
}

interface KYCStatusProps {
  meta: WithdrawalKYCStatusResponse
  onCancel: () => void
}

function AnchorWithdrawalKYCStatus(props: KYCStatusProps) {
  return (
    <VerticalLayout grow>
      <VerticalLayout alignItems="center" margin="0 auto" maxWidth="550px" textAlign="center" width="80%">
        {mapTo(props.meta.status, {
          denied: (
            <>
              <Typography variant="h5">Withdrawal denied</Typography>
              <Typography style={{ margin: "8px 0 0" }} variant="body2">
                The anchor responsible for this operation denied your withdrawal after checking your personal
                information. Please contact the anchor.
              </Typography>
            </>
          ),
          pending: (
            <>
              <Typography variant="h5">Customer information check in progress</Typography>
              <Typography style={{ margin: "8px 0 0" }} variant="body2">
                The anchor responsible for this operation is checking your personal information. Please try again later.
              </Typography>
              {props.meta.eta ? (
                <Typography style={{ margin: "8px 0 0" }} variant="body2">
                  Estimated time to completion: {formatDuration(props.meta.eta)}
                </Typography>
              ) : null}
            </>
          )
        })}
        {props.meta.more_info_url ? (
          <Typography style={{ margin: "8px 0 0" }} variant="body2">
            For more information, visit{" "}
            <a href={props.meta.more_info_url} target="_blank">
              {props.meta.more_info_url}
            </a>
          </Typography>
        ) : null}
        {/* TODO: Show more_info_url */}
      </VerticalLayout>
      <Box grow margin="24px 0 64px">
        {null}
      </Box>
      <Box>
        <Button variant="text">
          <ButtonIconLabel label="Back" style={{ paddingRight: 8 }}>
            <ChevronLeftIcon />
          </ButtonIconLabel>
        </Button>
      </Box>
    </VerticalLayout>
  )
}

export default AnchorWithdrawalKYCStatus

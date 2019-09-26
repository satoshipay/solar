import React from "react"
import grey from "@material-ui/core/colors/grey"
import Typography from "@material-ui/core/Typography"
import { Box } from "../Layout/Box"

interface Props {
  style?: React.CSSProperties
}

function InflationExplanation(props: Props) {
  return (
    <Box
      alignItems="stretch"
      grow={1}
      justifyContent="stretch"
      padding={32}
      style={{ background: grey["100"], ...props.style }}
    >
      <Typography gutterBottom variant="h6">
        Stellar Inflation
      </Typography>
      <Typography style={{ marginTop: 8 }} variant="body2">
        The Stellar network comes with a built-in inflation of 1% per year. The inflation is paid out weekly by
        distributing the funds among the existing Stellar accounts, so that each account receives their 1% over the
        course of the year.
      </Typography>
      <Typography style={{ marginTop: 8 }} variant="body2">
        The inflation is not paid out directly to each account on the network, but to inflation pool accounts. To
        receive inflation payments you need to join an inflation pool by setting your inflation destination to the pool
        account of your choice.
      </Typography>
      <Typography style={{ marginTop: 8 }} variant="body2">
        Read the{" "}
        <a href="https://www.lumenauts.com/guides/how-inflation-works" target="_blank">
          Lumenauts guide on inflation
        </a>{" "}
        for more details.
      </Typography>
    </Box>
  )
}

export default React.memo(InflationExplanation)

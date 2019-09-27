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
        The Stellar network comes with a built-in inflation of 1% per year.
      </Typography>
      <Typography style={{ marginTop: 8 }} variant="body2">
        New lumens are issued each week and distributed among the existing Stellar accounts, according to their balance.
        The inflation is not paid out to each account directly, but to pool accounts.
      </Typography>
      <Typography style={{ marginTop: 8 }} variant="body2">
        Join an inflation pool by setting your inflation destination to a pool account of your choice and receive weekly
        inflation payouts.
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

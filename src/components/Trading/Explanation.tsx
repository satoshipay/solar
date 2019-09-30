import React from "react"
import grey from "@material-ui/core/colors/grey"
import Typography from "@material-ui/core/Typography"
import { Box } from "../Layout/Box"

function Explanation() {
  return (
    <Box alignItems="stretch" grow={1} justifyContent="stretch" padding={32} style={{ background: grey["100"] }}>
      <Typography gutterBottom variant="h6">
        Trading assets
      </Typography>
      <Typography style={{ marginTop: 8 }} variant="body2">
        Convert your funds by trading them on the Stellar Decentralized Exchange (DEX).
      </Typography>
      <Typography style={{ marginTop: 8 }} variant="body2">
        The trade will be made at the best price currently on offer and should happen immediately. High price volatility
        and low market volume can lead to delayed order executions. The Stellar network will always try to buy at the
        lowest price first.
      </Typography>
      <Typography style={{ marginTop: 8 }} variant="body2">
        You can edit the price. If there is no matching counter offer on the exchange, your order will stay in the order
        book until someone creates a matching counter offer or you cancel the open offer.
      </Typography>
    </Box>
  )
}

export default Explanation

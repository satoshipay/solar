import React from 'react'
import Async from 'react-promise'
import Paper from 'material-ui/Paper'
import { AspectRatioBox, FloatingBox, VerticalLayout } from '../layout'
import SuccessIcon from './Icon/Success'

const FloatingStatusBox = ({ children }) => {
  return (
    <FloatingBox width='50%'>
      <AspectRatioBox width='100%' ratio='1:1'>
        <Paper zDepth={2} style={{ height: '100%' }}>
          <VerticalLayout padding={10} height='100%' justifyContent='center'>
            <span style={{ textAlign: 'center' }}>
              {children}
            </span>
          </VerticalLayout>
        </Paper>
      </AspectRatioBox>
    </FloatingBox>
  )
}

const SubmissionProgress = ({ promise }) => (
  // TODO: Proper UX
  <Async
    promise={promise}
    pending={
      <FloatingStatusBox>
        Sending transaction...
      </FloatingStatusBox>
    }
    then={
      () => (
        <FloatingStatusBox>
          <SuccessIcon />
          <div>
            Transaction successful
          </div>
        </FloatingStatusBox>
      )
    }
    catch={
      error => (
        <FloatingStatusBox>
          Transaction failed: {error.message || JSON.stringify(error)}
        </FloatingStatusBox>
      )
    }
  />
)

export default SubmissionProgress

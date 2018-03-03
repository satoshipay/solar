import React from 'react'
import Async from 'react-promise'
import Paper from 'material-ui/Paper'
import CircularProgress from 'material-ui/CircularProgress'
import { AspectRatioBox, FloatingBox, VerticalLayout } from '../layout'
import ErrorIcon from './Icon/Error'
import SuccessIcon from './Icon/Success'

const FloatingStatusBox = ({ children }) => {
  return (
    <FloatingBox width='50%' maxWidth='40vw'>
      <AspectRatioBox width='100%' ratio='3:2'>
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
  <Async
    promise={promise}
    pending={
      <FloatingStatusBox>
        <CircularProgress size={70} style={{ marginTop: 10, marginBottom: 20 }} />
        <div>
          Sending transaction...
        </div>
      </FloatingStatusBox>
    }
    then={
      () => (
        <FloatingStatusBox>
          <SuccessIcon size={100} />
          <div>
            Transaction successful
          </div>
        </FloatingStatusBox>
      )
    }
    catch={
      error => (
        <FloatingStatusBox>
          <ErrorIcon size={100} />
          <div>
            Transaction failed: {error.message || JSON.stringify(error)}
          </div>
        </FloatingStatusBox>
      )
    }
  />
)

export default SubmissionProgress

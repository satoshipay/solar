import React from 'react'
import { storiesOf } from '@storybook/react'
import ProvidersDecorator from './decorators/ProvidersDecorator'
import SubmissionProgress from '../src/components/SubmissionProgress'

storiesOf('SubmissionProgress', module)
  .addDecorator(ProvidersDecorator)
  .add('pending', () => (
    <SubmissionProgress promise={new Promise(resolve => {})} />
  ))
  .add('success', () => (
    <SubmissionProgress promise={Promise.resolve()} />
  ))
  .add('failed', () => (
    <SubmissionProgress promise={Promise.reject(new Error('Test error'))} />
  ))

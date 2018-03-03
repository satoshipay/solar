import { configure } from '@storybook/react'

function loadStories() {
  require('../stories/index')
}

configure(loadStories, module)

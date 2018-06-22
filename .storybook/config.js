import { addDecorator, configure } from '@storybook/react'
import centered from '@storybook/addon-centered'

function loadStories() {
  require('../stories/index')
}

addDecorator(centered)
configure(loadStories, module)

const removeNullValueProps = object => {
  return Object.keys(object).reduce((result, propKey) => {
    const propValue = object[propKey]
    if (propValue !== null) {
      return Object.assign(result, { [propKey]: propValue })
    } else {
      return result
    }
  }, {})
}

const createSizingStyle = ({ width = null, height = null, padding = 0 }) => {
  return {
    padding,
    width,
    height
  }
}

const createFlexChildStyle = ({ grow = false, shrink = false, fixed = false, alignSelf = false }) => {
  const style = {}
  if (grow) {
    style.flexGrow = 1
  }
  if (shrink) {
    style.flexShrink = 1
  }
  if (fixed) {
    style.flexGrow = 0
    style.flexShrink = 0
  }
  if (alignSelf) {
    style.alignSelf = alignSelf
  }
  return style
}

const createBoxStyle = styleProps => {
  const {
    margin = 0,
    overflow = 'visible'
  } = styleProps

  const style = {
    margin,
    overflow,
    ...createSizingStyle(styleProps),
    ...createFlexChildStyle(styleProps)
  }
  return removeNullValueProps(style)
}

export default createBoxStyle

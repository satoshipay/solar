const path = require("path")
const webpack = require("webpack")

// Source: <https://medium.com/@mtiller/storybook-react-typescript-and-jest-c9059ea06fa7>
const genDefaultConfig = require("@storybook/react/dist/server/config/defaults/webpack.config.js")

module.exports = (baseConfig, env) => {
  const config = genDefaultConfig(baseConfig, env)

  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve("awesome-typescript-loader")
  })
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/\/platform\/key-store$/, resource => {
      resource.request = resource.request.replace("/platform/key-store", "/platform/web/key-store")
    })
  )
  config.resolve.extensions.push(".ts", ".tsx")

  return config
}

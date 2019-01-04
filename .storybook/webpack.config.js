const webpack = require("webpack")

module.exports = (baseConfig, env, defaultConfig) => {
  defaultConfig.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve("awesome-typescript-loader")
  })
  defaultConfig.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/\/platform\/key-store$/, resource => {
      resource.request = resource.request.replace("/platform/key-store", "/platform/web/key-store")
    })
  )
  defaultConfig.resolve.extensions.push(".ts", ".tsx")

  return defaultConfig
}

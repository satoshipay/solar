const webpack = require("webpack")

module.exports = async function customizeWebpackConfig({ config }) {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve("ts-loader")
  })
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/\/platform\/key-store$/, resource => {
      resource.request = resource.request.replace("/platform/key-store", "/platform/web/key-store")
    })
  )
  config.resolve.extensions.push(".ts", ".tsx")

  return config
}

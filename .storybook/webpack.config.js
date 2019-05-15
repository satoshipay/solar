const webpack = require("webpack")

module.exports = async function customizeWebpackConfig({ config }) {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve("ts-loader")
  })
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/\/platform\/key-store$/, resource => {
      resource.request = resource.request.replace("/platform/key-store", "/platform/web/key-store")
    }),
    // Quick-fix until <https://github.com/stellar/js-stellar-base/pull/196> is merged
    new webpack.IgnorePlugin(/sodium-native/)
  )
  config.resolve.extensions.push(".ts", ".tsx")

  return config
}

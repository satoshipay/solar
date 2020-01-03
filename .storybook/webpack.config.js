module.exports = async function customizeWebpackConfig({ config }) {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve("ts-loader")
  })
  config.resolve.extensions.push(".ts", ".tsx")

  return config
}

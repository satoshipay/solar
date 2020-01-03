const WorkerPlugin = require("@satoshipay/worker-plugin")

module.exports = async function customizeWebpackConfig({ config }) {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve("ts-loader")
  })
  config.output.globalObject = "self"
  config.resolve.extensions.push(".ts", ".tsx")
  config.plugins.push(new WorkerPlugin({ preserveTypeModule: true }))

  return config
}

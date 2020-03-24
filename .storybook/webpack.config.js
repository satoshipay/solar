const WorkerPlugin = require("@satoshipay/worker-plugin")
const fs = require("fs")
const path = require("path")

module.exports = async function customizeWebpackConfig({ config }) {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve("ts-loader")
  })
  config.output.globalObject = "self"
  config.resolve.alias = {
    ...config.resolve.alias,
    ...createModuleAliases()
  }
  config.resolve.extensions.push(".ts", ".tsx")
  config.plugins.push(new WorkerPlugin({ preserveTypeModule: true }))

  return config
}

function createModuleAliases() {
  const modules = fs.readdirSync(path.join(__dirname, "../src")).filter(filename => filename.match(/^[A-Z][^\.]+/))

  return modules.reduce(
    (aliases, moduleName) => ({ ...aliases, [`~${moduleName}`]: path.join(__dirname, `../src/${moduleName}`) }),
    {}
  )
}

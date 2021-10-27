const { exec } = require("child_process")

module.exports = async ({ electronPlatformName, appOutDir, packager }) => {
  // only macos
  if (electronPlatformName !== `darwin`) return
  const appName = packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  await removeInvalidSymlinks({ appPath })
}

async function removeInvalidSymlinks({
  // string
  appPath
}) {
  const invalidSymlinksInManyLines = await new Promise((resolve, reject) => {
    exec(`find '${appPath}/Contents' -type l ! -exec test -e {} \\; -print`, (error, stdout, stderr) => {
      console.log(`command: find ${appPath}/Contents -type l ! -exec test -e {} \\; -print`)
      if (error) {
        console.error(`error: ${error.message}`)
        return reject(error)
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`)
        return reject(stderr)
      }
      console.log(`stdout: ${stdout}`)
      resolve(stdout)
    })
  })

  console.log("======invalidSymlinksInManyLines======")
  console.log(invalidSymlinksInManyLines)
  console.log("===========================")

  const invalidSymlinksInArray = invalidSymlinksInManyLines
    .split("\n")
    .map(invalidSymlink => invalidSymlink.trim())
    .filter(maybeEmptyPath => maybeEmptyPath !== "")

  console.log("======invalidSymlinksInArray======")
  console.log(invalidSymlinksInArray)
  console.log("===========================")

  const waitUntilAllInvalidSymlinksRemoved = invalidSymlinksInArray.map(invalidSymlink => {
    return new Promise((resolve, reject) => {
      exec(`rm '${invalidSymlink}'`, (error, stdout, stderr) => {
        console.log(`command: rm ${invalidSymlink}`)

        if (error) {
          console.error(`error: ${error.message}`)
          return reject(error)
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`)
          return reject(stderr)
        }
        console.log(`stdout: ${stdout}`)
        resolve(stdout)
      })
    })
  })

  try {
    await Promise.all(waitUntilAllInvalidSymlinksRemoved)
  } catch (e) {
    console.log(`error happened while removing all invalid symlinks. message: ${e.message}`)
  }

  return
}

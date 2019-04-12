#!/usr/bin/env node
// source: https://github.com/jumoel/env-subst

const fs = require("fs")

function envsubst(stringContent) {
  const regex = /\$(?:(\w+)|{(\w+)})/g

  return stringContent.replace(regex, (original, g1, g2) => {
    const variable = g1 || g2

    return process.env.hasOwnProperty(variable) ? process.env[variable] : original
  })
}

if (process.argv.length < 3) {
  console.error("Usage: env-subst inputFile")
  process.exit(1)
}

const inputFile = process.argv[2]

if (!fs.existsSync(inputFile)) {
  console.error(`File ${inputFile} does not exist`)
  process.exit(1)
}

const fileContent = fs.readFileSync(inputFile).toString()

process.stdout.write(envsubst(fileContent))

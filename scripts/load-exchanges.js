#!/usr/bin/env node

const https = require("https")
const fs = require("fs")

const url = "https://api.stellar.expert/api/explorer/public/directory"
const destinationFilePath = "../src/well-known-stellar-exchanges.json"

https
  .get(url, { headers: { "User-Agent": "Mozilla" } }, response => {
    let data = ""

    response.on("data", chunk => {
      data += chunk
    })

    response.on("end", () => {
      processData(data)
    })
  })
  .on("error", error => {
    console.log("Error: " + error.message)
  })

function processData(data) {
  const json = JSON.parse(data)

  const wellKnownAccounts = json._embedded.records

  const exchanges = wellKnownAccounts.filter(account => account.tags.indexOf("exchange") > -1)
  exchanges.forEach(exchange => {
    delete exchange.paging_token
    delete exchange.tags
  })

  console.log(exchanges)

  writeToFile(destinationFilePath, exchanges)
}

function writeToFile(filePath, data) {
  fs.writeFile(filePath, JSON.stringify(data), function(err) {
    if (err) {
      return console.log(err)
    }

    console.log("The file was saved!")
  })
}

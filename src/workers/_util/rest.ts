import { CustomError } from "../../lib/errors"

export async function parseJSONResponse<ResponseBody>(response: Response): Promise<ResponseBody> {
  const isJSON = /^application\/([a-z]+\+)?json/.test(response.headers.get("Content-Type") || "")

  if (!response.ok) {
    const text = await response.text()
    const jsonMessage = isJSON ? JSON.parse(text).details : undefined
    const message = jsonMessage || text
    throw CustomError(
      "RequestFailedError",
      `Request to ${response.url} failed with status ${response.status}: ${message}`,
      {
        target: response.url,
        status: response.status,
        message
      }
    )
  }

  if (!isJSON) {
    throw CustomError(
      "ExpectedJsonResponseError",
      `Expected ${response.url} to return a JSON response. Content type was ${response.headers.get(
        "Content-Type"
      )} instead.`,
      { url: response.url, contentType: response.headers.get("Content-Type") }
    )
  }

  return response.json()
}

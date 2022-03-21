import type { ServerResponse } from "http"
import polka from "polka"

export function redirect (res: ServerResponse, url) {
  res.writeHead(302, {
    Location: url,
  })

  res.end()
}

export function getHost (req: polka.Request) {
  console.log(req.headers)
}

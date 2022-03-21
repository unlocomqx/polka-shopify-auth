import { ServerResponse } from "http"
import polka from "polka"
import querystring from "querystring"

import redirectionPage from "./redirection-page"

export default function createTopLevelRedirect (apiKey: string, path: string) {
  return function topLevelRedirect (req: polka.Request, res: ServerResponse) {
    const { query } = req
    const { shop, host } = query

    const params = { shop }
    const queryString = querystring.stringify(params)
    res.end(redirectionPage({
      origin    : shop,
      redirectTo: `https://${ req.host }${ path }?${ queryString }`,
      apiKey,
      host,
    }))
  }
}

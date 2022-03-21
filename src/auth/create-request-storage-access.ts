import Shopify from "@shopify/shopify-api"
import fs from "fs"
import { ServerResponse } from "http"
import path from "path"
import polka from "polka"

import { OAuthStartOptions } from "../types"
import itpHelper from "./client/itp-helper"
import css from "./client/polaris-css"
import requestStorageAccess from "./client/request-storage-access"
import storageAccessHelper from "./client/storage-access-helper"
import Error from "./errors"

const HEADING = "This app needs access to your browser data"
const BODY =
  "Your browser is blocking this app from accessing your data. To continue using this app, click Continue, then click Allow if the browser prompts you."
const ACTION = "Continue"

const APP_BRIDGE_SCRIPT = fs.readFileSync(
  path.resolve(`${ __dirname }/../app-bridge-2.0.12.js`),
)

export default function createRequestStorageAccess
({
   prefix,
 }: OAuthStartOptions) {
  return function requestStorage (req: polka.Request, res: ServerResponse) {
    const { query } = req

    const shop = query.shop as string
    const host = query.host as string

    if (shop == null) {
      res.writeHead(400, Error.ShopParamMissing)
      return
    }

    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    ${ css }
  </style>
  <base target="_top">
  <title>Redirecting…</title>

  <script>${ APP_BRIDGE_SCRIPT }</script>
  <script>
    window.apiKey = "${ Shopify.Context.API_KEY }";
    window.host = "${ host }";
    window.shopOrigin = "https://${ encodeURIComponent(shop) }";
    ${ itpHelper }
    ${ storageAccessHelper }
    ${ requestStorageAccess(shop, host, prefix) }
  </script>
</head>
<body>
  <main id="RequestStorageAccess">
    <div class="Polaris-Page">
      <div class="Polaris-Page__Content">
        <div class="Polaris-Layout">
          <div class="Polaris-Layout__Section">
            <div class="Polaris-Stack Polaris-Stack--vertical">
              <div class="Polaris-Stack__Item">
                <div class="Polaris-Card">
                  <div class="Polaris-Card__Header">
                    <h1 class="Polaris-Heading">${ HEADING }</h1>
                  </div>
                  <div class="Polaris-Card__Section">
                    <p>${ BODY }</p>
                  </div>
                </div>
              </div>
              <div class="Polaris-Stack__Item">
                <div class="Polaris-Stack Polaris-Stack--distributionTrailing">
                  <div class="Polaris-Stack__Item">
                    <button type="button" class="Polaris-Button Polaris-Button--primary" id="TriggerAllowCookiesPrompt">
                      <span class="Polaris-Button__Content"><span>${ ACTION }</span></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`)
  }
}

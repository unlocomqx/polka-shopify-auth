import Shopify from "@shopify/shopify-api"
import { ServerResponse } from "http"
import type polka from "polka"

import { OAuthStartOptions } from "../types"
import itpHelper from "./client/itp-helper"

import css from "./client/polaris-css"
import topLevelInteraction from "./client/top-level-interaction"
import Error from "./errors"

const HEADING = "Enable cookies"
const BODY =
  "You must manually enable cookies in this browser in order to use this app within Shopify."
const FOOTER = `Cookies let the app authenticate you by temporarily storing your preferences and personal
information. They expire after 30 days.`
const ACTION = "Enable cookies"

export default function createEnableCookies ({ prefix }: OAuthStartOptions) {
  return function enableCookies (req: polka.Request, res: ServerResponse) {
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

  <script>
    window.apiKey = "${ Shopify.Context.API_KEY }";
    window.host = "${ host }";
    window.shopOrigin = "https://${ encodeURIComponent(shop) }";

    ${ itpHelper }
    ${ topLevelInteraction(shop, host, prefix) }
  </script>
</head>
<body>
  <main id="TopLevelInteractionContent">
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
                  <div class="Polaris-Card__Section Polaris-Card__Section--subdued">
                    <p>${ FOOTER }</p>
                  </div>
                </div>
              </div>
              <div class="Polaris-Stack__Item">
                <div class="Polaris-Stack Polaris-Stack--distributionTrailing">
                  <div class="Polaris-Stack__Item">
                    <button type="button" class="Polaris-Button Polaris-Button--primary" id="TopLevelInteractionButton">
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

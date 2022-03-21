import Shopify, { AuthQuery } from "@shopify/shopify-api"
import Cookies from "cookies"
import { ServerResponse } from "http"
import type polka from "polka"
import { redirect } from "../polka-helpers"
import { AccessMode, NextFunction, OAuthStartOptions } from "../types"

import getCookieOptions from "./cookie-options"
import createEnableCookies from "./create-enable-cookies"
import createRequestStorageAccess from "./create-request-storage-access"
import createTopLevelOAuthRedirect from "./create-top-level-oauth-redirect"
import setUserAgent from "./set-user-agent"

const DEFAULT_MYSHOPIFY_DOMAIN = "myshopify.com"
export const DEFAULT_ACCESS_MODE: AccessMode = "online"

export const TOP_LEVEL_OAUTH_COOKIE_NAME = "shopifyTopLevelOAuth"
export const TEST_COOKIE_NAME = "shopifyTestCookie"
export const GRANTED_STORAGE_ACCESS_COOKIE_NAME =
  "shopify.granted_storage_access"

function hasCookieAccess (cookies: Cookies) {
  return Boolean(cookies.get(TEST_COOKIE_NAME))
}

function grantedStorageAccess (cookies: Cookies) {
  return Boolean(cookies.get(GRANTED_STORAGE_ACCESS_COOKIE_NAME))
}

function shouldPerformInlineOAuth (cookies: Cookies) {
  return Boolean(cookies.get(TOP_LEVEL_OAUTH_COOKIE_NAME))
}

export default function createShopifyAuth (options: OAuthStartOptions) {
  const config = {
    prefix         : "",
    myShopifyDomain: DEFAULT_MYSHOPIFY_DOMAIN,
    accessMode     : DEFAULT_ACCESS_MODE,
    ...options,
  }

  const { prefix } = config

  const oAuthStartPath = `${ prefix }/auth`
  const oAuthCallbackPath = `${ oAuthStartPath }/callback`

  const inlineOAuthPath = `${ prefix }/auth/inline`
  const topLevelOAuthRedirect = createTopLevelOAuthRedirect(
    Shopify.Context.API_KEY,
    inlineOAuthPath,
  )

  const enableCookiesPath = `${ oAuthStartPath }/enable_cookies`
  const enableCookies = createEnableCookies(config)
  const requestStorageAccess = createRequestStorageAccess(config)

  setUserAgent()

  return async function shopifyAuth (req: polka.Request, res: ServerResponse, next: NextFunction) {
    const cookies = new Cookies(req, res, {
      secure: true,
      keys  : options.keys || []
    })

    if (
      req.path === oAuthStartPath &&
      !hasCookieAccess(cookies) &&
      !grantedStorageAccess(cookies)
    ) {
      await requestStorageAccess(req, res)
      return
    }

    if (
      req.path === inlineOAuthPath ||
      (req.path === oAuthStartPath && shouldPerformInlineOAuth(cookies))
    ) {
      const shop = req.query.shop as string
      if (shop == null) {
        res.writeHead(400)
      }

      cookies.set(TOP_LEVEL_OAUTH_COOKIE_NAME, "", getCookieOptions(req))
      const redirectUrl = await Shopify.Auth.beginAuth(
        req,
        res,
        shop,
        oAuthCallbackPath,
        config.accessMode === "online",
      )
      redirect(res, redirectUrl)
      return
    }

    if (req.path === oAuthStartPath) {
      await topLevelOAuthRedirect(req, res, cookies)
      return
    }

    if (req.path === oAuthCallbackPath) {
      try {
        const authQuery: AuthQuery = {
          code     : req.query.code as string,
          shop     : req.query.shop as string,
          host     : req.query.host as string,
          state    : req.query.state as string,
          timestamp: req.query.timestamp as string,
          hmac     : req.query.hmac as string,
        }

        if (config.afterAuth) {
          await config.afterAuth({
            ...await Shopify.Auth.validateAuthCallback(
              req,
              res,
              authQuery,
            ),
            host: req.headers.host
          })
        }
      } catch (e) {
        switch (true) {
          case e instanceof Shopify.Errors.InvalidOAuthError:
            res.writeHead(400, e.message)
            break
          case e instanceof Shopify.Errors.CookieNotFound:
          case e instanceof Shopify.Errors.SessionNotFound:
            // This is likely because the OAuth session cookie expired before the merchant approved the request
            redirect(res, `${ oAuthStartPath }?shop=${ req.query.shop }`)
            break
          default:
            res.writeHead(500, e.message)
            break
        }
      }
      return
    }

    if (req.path === enableCookiesPath) {
      await enableCookies(req, res)
      return
    }

    await next()
  }
}

export { default as Error } from "./errors"

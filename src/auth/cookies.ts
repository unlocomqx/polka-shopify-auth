import cookie from "cookie"

export type Cookies = Map<string, string>

export function parseCookies (cookies: string | undefined): Cookies {
  return new Map(Object.entries(cookie.parse(cookies || "")))
}

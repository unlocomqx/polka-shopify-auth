import type polka from "polka"

export default function getCookieOptions (req: polka.Request) {
  const { headers } = req
  const userAgent = headers["user-agent"]
  const isChrome = userAgent && userAgent.match(/chrome|crios/i)
  let cookieOptions = {}
  if (isChrome) {
    cookieOptions = {
      secure: true,
    }
  }
  return cookieOptions
}

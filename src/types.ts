import { SessionInterface } from "@shopify/shopify-api"

export type AccessMode = "online" | "offline";

export interface AuthConfig {
  keys: string[],
  myShopifyDomain?: string;
  accessMode?: "online" | "offline";
  afterAuth? (result: AuthResult): void;
}

export interface OAuthStartOptions extends AuthConfig {
  prefix?: string;
}

export interface NextFunction {
  (): any;
}

export type AuthResult = SessionInterface & {
  host: string | undefined
}

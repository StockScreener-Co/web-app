export * from "./generated/api";
export * from "./generated/api.schemas";
export {
  setBaseUrl,
  setAuthTokenGetter,
  setOnUnauthorized,
  customFetch,
} from "./custom-fetch";
export type { AuthTokenGetter, OnUnauthorized } from "./custom-fetch";

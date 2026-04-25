export * from "./generated/api";
export * from "./generated/api.schemas";
export {
  setBaseUrl,
  setOnUnauthorized,
  customFetch,
  ApiError,
} from "./custom-fetch";
export type { OnUnauthorized } from "./custom-fetch";

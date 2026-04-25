import { ApiError } from "@workspace/api-client-react";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { suppressErrorToast?: boolean };
    queryMeta: { suppressErrorToast?: boolean };
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    // Only surface raw backend messages for 4xx — those are user-actionable.
    // 5xx messages are server bugs (JDBC exceptions, stack traces) — never show them.
    if (error.status >= 400 && error.status < 500) {
      const data = error.data as any;
      const backendMsg = data?.detail || data?.message || data?.error;
      if (backendMsg && typeof backendMsg === "string") return backendMsg;
    }

    switch (error.status) {
      case 403: return "You don't have permission to do this";
      case 404: return "Not found";
      case 409: return "Already exists";
      case 429: return "Too many requests, please try again later";
      case 500:
      case 502:
      case 503: return "Something went wrong, please try again";
    }
  }
  return fallback;
}

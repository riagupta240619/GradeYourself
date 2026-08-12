/**
 * Type-safe error extraction utilities for Axios-style errors.
 * Replaces the pervasive `catch (err: any)` pattern with properly typed alternatives.
 */

interface AxiosLikeError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

function isAxiosLikeError(err: unknown): err is AxiosLikeError {
  return (
    err !== null &&
    typeof err === "object" &&
    "response" in err
  );
}

/** Extract a user-friendly error message from an Axios error, with a fallback. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosLikeError(err)) {
    return err.response?.data?.message || fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

/** Extract the HTTP status code from an Axios error, or null. */
export function getErrorStatus(err: unknown): number | null {
  if (isAxiosLikeError(err)) {
    return err.response?.status ?? null;
  }
  return null;
}

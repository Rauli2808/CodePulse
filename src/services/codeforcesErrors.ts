export type CodeforcesErrorCode =
  | "INVALID_HANDLE"
  | "USER_NOT_FOUND"
  | "NETWORK"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "MALFORMED_RESPONSE"
  | "PARTIAL_COMPARISON";

export class CodeforcesApiError extends Error {
  constructor(
    public readonly code: CodeforcesErrorCode,
    message: string,
    public readonly handle?: string,
  ) {
    super(message);
    this.name = "CodeforcesApiError";
  }
}

export function getUserFacingError(error: unknown) {
  if (error instanceof CodeforcesApiError) return error.message;
  return "Something unexpected happened while loading Codeforces data.";
}

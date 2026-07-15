import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError("BAD_REQUEST", message, 400, details);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError("FORBIDDEN", message, 403);
  }

  static notFound(message: string = "Not found") {
    return new ApiError("NOT_FOUND", message, 404);
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError("CONFLICT", message, 409, details);
  }

  static validation(message: string, details?: unknown) {
    return new ApiError("VALIDATION_ERROR", message, 422, details);
  }

  static internalError(message: string = "Internal server error") {
    return new ApiError("INTERNAL_ERROR", message, 500);
  }
}

export function zodToApiError(error: ZodError): ApiError {
  const flattened = error.flatten();
  return ApiError.validation("Validation failed", flattened);
}

import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { problemResponse } from "./schemas.js";

/** Base class for application errors that map to an HTTP status. Throw a subclass and let `app.onError` turn it into an RFC 9457 Problem Details response. */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: ContentfulStatusCode,
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request") {
    super(message, 400);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

/** Map an {@link AppError} to an RFC 9457 Problem Details response. For use in Hono's `app.onError`. */
export function appErrorToProblem(error: AppError, c: Context): Response {
  return problemResponse(c, error.statusCode, error.message);
}

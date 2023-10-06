import {
  AuthenticationError,
  AuthorizationError,
  BadRequestException,
  ExternalServiceError,
  InternalServerException,
  NotFoundException,
  PasswordChangeRequiredError,
  ValidationException,
} from "@/exceptions/runtime.exceptions";
import { AppConstants } from "@/server.constants";
import { NextFunction, Request, Response } from "express";
import { HttpStatusCode } from "@/constants/http-status-codes.constants";

export function exceptionHandler(err, req: Request, res: Response, next: NextFunction) {
  const isTest = process.env.NODE_ENV === AppConstants.defaultTestEnv;
  if (!isTest) {
    console.error("[API Exception Handler]", err.stack || err?.response?.data);
  }
  if (err.isAxiosError) {
    const code = err.response?.status || 500;
    return res.status(code).send({
      error: "External API call failed",
      type: "axios-error",
      data: err.response?.data,
    });
  }
  if (err instanceof AuthenticationError) {
    const code = err.statusCode || 401;
    return res.status(code).send({ error: err.message });
  }
  if (err instanceof AuthorizationError) {
    const code = err.statusCode || 403;
    const permissions = err.permissions;
    const roles = err.roles;
    const error = err.message || "You lack permission to this resource";
    const reason = err.reason;
    return res.status(code).send({ error, reason, permissions, roles });
  }
  if (err instanceof PasswordChangeRequiredError) {
    const code = err.statusCode || HttpStatusCode.CONFLICT;
    return res.status(code).send({ error: err.message });
  }
  if (err instanceof NotFoundException) {
    const code = err.statusCode || 404;
    return res.status(code).send({ error: err.message });
  }
  if (err instanceof BadRequestException) {
    const code = err.statusCode || 400;
    return res.status(code).send({ error: err.message });
  }
  if (err instanceof ValidationException) {
    const code = err.statusCode || 400;
    return res.status(code).send({
      error: "API could not accept this input",
      type: err.name,
      errors: err.errors,
    });
  }
  if (err instanceof InternalServerException) {
    const code = err.statusCode || 500;
    return res.status(code).send({
      error: err.message,
      type: err.name,
      stack: err.stack,
    });
  }
  if (err instanceof ExternalServiceError) {
    const code = err.error.statusCode || 500;
    return res.status(code).send(err.error);
  }
  if (!!err) {
    const code = err.statusCode || 500;
    return res.status(code).send({
      error: "Server experienced an internal error",
      type: err.name,
      stack: err.stack,
    });
  }

  // Will result in not found on API level
  next();
}

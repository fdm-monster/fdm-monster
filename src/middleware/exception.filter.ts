import {
  AuthenticationError,
  AuthorizationError,
  BadRequestException,
  ConflictException,
  ExternalServiceError,
  ForbiddenError,
  InternalServerException,
  NotFoundException,
  ValidationException,
} from "@/exceptions/runtime.exceptions";
import { AppConstants } from "@/server.constants";
import { NextFunction, Response, Request } from "express";
import { AxiosError } from "axios";
import { EntityNotFoundError } from "typeorm";
import { FailedDependencyException } from "@/exceptions/failed-dependency.exception"
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";

export class ExceptionFilter {
  private readonly logger: LoggerService;

  constructor(loggerFactory: ILoggerFactory) {
    this.logger = loggerFactory(ExceptionFilter.name);
  }

  handle(err: AxiosError | any, _req: any | Request, res: Response, next: NextFunction): void {
    const isTest = process.env.NODE_ENV === AppConstants.defaultTestEnv;
    if (!isTest) {
      this.logger.error("API Exception occurred", {
        message: err.message,
        stack: err.stack || err?.response?.data,
        url: _req?.url,
        method: _req?.method,
        userAgent: _req?.headers?.['user-agent'],
        errorType: err.constructor.name
      });
    }
    if (err.isAxiosError) {
      const code = err.response?.status || 500;
      res.status(code).send({
        error: "External API call failed",
        type: "axios-error",
        data: err.response?.data?._readableState ? null : err.response?.data,
      });
      return;
    }
    if (err instanceof AuthenticationError) {
      res.status(401).send({ error: err.message, reasonCode: err.reasonCode });
      return;
    }
    if (err instanceof AuthorizationError) {
      const permissions = err.permissions;
      const roles = err.roles;
      const error = err.message || "You lack permission to this resource";
      const reason = err.reason;
      res.status(403).send({ error, reason, permissions, roles });
      return;
    }
    if (err instanceof ForbiddenError) {
      res.status(403).send({ error: err.message });
      return;
    }
    if (err instanceof NotFoundException || err instanceof EntityNotFoundError) {
      res.status(404).send({ error: err.message });
      return;
    }
    if (err instanceof BadRequestException) {
      res.status(400).send({ error: err.message });
      return;
    }
    if (err instanceof ConflictException) {
      res.status(409).send({
        error: err.message,
        existingResourceId: err.existingResourceId,
      });
      return;
    }
    if (err instanceof ValidationException) {
      res.status(400).send({
        error: "API could not accept this input",
        type: err.name,
        errors: err.errors,
      });
      return;
    }
    if (err instanceof FailedDependencyException) {
      res.status(424).send({
        error: err.message,
        serviceCode: err.serviceCode,
        type: err.name,
      });
      return;
    }
    if (err instanceof InternalServerException) {
      res.status(500).send({
        error: err.message,
        type: err.name,
        stack: err.stack,
      });
      return;
    }
    if (err instanceof ExternalServiceError) {
      res.status(500).send(err.error);
      return;
    }
    if (err) {
      res.status(500).send({
        error: "Server experienced an internal error",
        type: err.name,
        stack: err.stack,
      });
      return;
    }

    // Will result in not found on API level
    next();
  }
}

// Backward compatibility - keep the function export for existing code
export function exceptionFilter(_err: AxiosError | any, _req: any | Request, _res: Response, _next: NextFunction): void {
  throw new Error("Use ExceptionFilter class instead of exceptionFilter function. Please inject ExceptionFilter and use .handle method.");
}

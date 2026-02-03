export class NotImplementedException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = NotImplementedException.name;
  }
}

export class AuthenticationError extends Error {
  reasonCode: string;

  constructor(error?: string, reasonCode = "") {
    super(error);
    this.name = AuthenticationError.name;
    this.reasonCode = reasonCode;
  }
}

export class ForbiddenError extends Error {
  constructor(error?: string) {
    super(error);
    this.name = ForbiddenError.name;
  }
}

export class AuthorizationError extends Error {
  permissions?: string[] = [];
  roles?: string[] = [];
  reason?: string;

  constructor({ permissions, roles, reason }: { permissions?: string[]; roles?: string[]; reason?: string }) {
    super("Authorization failed");
    this.name = AuthorizationError.name;
    this.reason = reason;
    this.permissions = permissions;
    this.roles = roles;
  }
}

export class BadRequestException extends Error {
  constructor(message: string) {
    super(message);
    this.name = BadRequestException.name;
  }
}

export class ConflictException extends Error {
  existingResourceId?: string;

  constructor(message: string, existingResourceId?: string) {
    super(message);
    this.name = ConflictException.name;
    this.existingResourceId = existingResourceId;
  }
}

export class NotFoundException extends Error {
  path?: string;

  constructor(message: string, path?: string) {
    super(message);
    this.name = NotFoundException.name;
    this.path = path;
  }
}

export class ValidationException<T = any> extends Error {
  errors: T;

  constructor(validationObject: T) {
    super(JSON.stringify(validationObject));
    this.name = ValidationException.name;
    this.errors = validationObject;
  }
}

export class ExternalServiceError extends Error {
  error: any;
  serviceType?: string;

  constructor(responseObject: any, serviceType?: string) {
    super(JSON.stringify(responseObject));
    this.name = ExternalServiceError.name;
    this.error = responseObject;
    this.serviceType = serviceType;
  }
}

export class InternalServerException extends Error {
  constructor(message: string, stack?: any) {
    super(message);
    this.name = InternalServerException.name;
    this.stack = stack;
  }
}

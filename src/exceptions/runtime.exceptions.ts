export class NotImplementedException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = NotImplementedException.name;
  }
}

export class AuthenticationError extends Error {
  constructor(error?: string) {
    super(error);
    this.name = AuthenticationError.name;
  }
}

export class PasswordChangeRequiredError extends Error {
  constructor() {
    super("Password change required");
    this.name = PasswordChangeRequiredError.name;
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

export class NotFoundException extends Error {
  path?: string;

  constructor(message: string, path?: string) {
    super(message);
    this.name = NotFoundException.name;
    this.path = path;
  }
}

export class ValidationException extends Error {
  errors: any;

  constructor(validationObject: any) {
    super(JSON.stringify(validationObject));
    this.name = ValidationException.name;
    this.errors = validationObject;
  }
}

export class ExternalServiceError extends Error {
  error: any;

  constructor(responseObject: any) {
    super(JSON.stringify(responseObject));
    this.name = ExternalServiceError.name;
    this.error = responseObject;
  }
}

export class InternalServerException extends Error {
  constructor(message: string, stack?: any) {
    super(message);
    this.name = InternalServerException.name;
    this.stack = stack;
  }
}

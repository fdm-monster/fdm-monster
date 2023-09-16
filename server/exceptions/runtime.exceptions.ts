export class NotImplementedException extends Error {
  constructor(message) {
    super(message);
    this.name = NotImplementedException.name;
  }
}

export class AuthenticationError extends Error {
  constructor(error) {
    super(error);
    this.name = AuthenticationError.name;
  }
}

export class AuthorizationError extends Error {
  permissions = [];
  roles = [];

  constructor({ permissions, roles, reason }) {
    super("Authorization failed");
    this.name = AuthorizationError.name;
    this.reason = reason;
    this.permissions = permissions;
    this.roles = roles;
  }
}

export class BadRequestException extends Error {
  constructor(message) {
    super(message);
    this.name = BadRequestException.name;
  }
}

export class NotFoundException extends Error {
  constructor(message, path) {
    super(message);
    this.name = NotFoundException.name;
    this.path = path;
  }
}

export class ValidationException extends Error {
  constructor(validationObject) {
    super(JSON.stringify(validationObject));
    this.name = ValidationException.name;
    this.errors = validationObject;
  }
}

export class ExternalServiceError extends Error {
  constructor(responseObject) {
    super(JSON.stringify(responseObject));
    this.name = ExternalServiceError.name;
    this.error = responseObject;
  }
}

export class InternalServerException extends Error {
  constructor(message, stack) {
    super(message);
    this.name = InternalServerException.name;
    this.stack = stack;
  }
}

module.exports = {
  NotImplementedException,
  BadRequestException,
  NotFoundException,
  AuthenticationError,
  AuthorizationError,
  InternalServerException,
  ExternalServiceError,
  ValidationException,
};

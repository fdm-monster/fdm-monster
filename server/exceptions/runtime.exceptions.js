class NotImplementedException extends Error {
  constructor(message) {
    super(message);
    this.name = NotImplementedException.name;
  }
}

class AuthenticationError extends Error {
  constructor(error) {
    super(error);
    this.name = AuthenticationError.name;
  }
}

class AuthorizationError extends Error {
  constructor(criterium) {
    super(`Authorization failed ${criterium.toString()}`);
    this.name = AuthorizationError.name;
  }
}

class NotFoundException extends Error {
  constructor(message, path) {
    super(message);
    this.name = NotFoundException.name;
    this.path = path;
  }
}

class ValidationException extends Error {
  constructor(validationObject) {
    super(JSON.stringify(validationObject));
    this.name = ValidationException.name;
    this.errors = validationObject;
  }
}

class ExternalServiceError extends Error {
  constructor(responseObject) {
    super(JSON.stringify(responseObject));
    this.name = ExternalServiceError.name;
    this.error = responseObject;
  }
}

class InternalServerException extends Error {
  constructor(message, stack) {
    super(message);
    this.name = InternalServerException.name;
    this.stack = stack;
  }
}

module.exports = {
  NotImplementedException,
  NotFoundException,
  AuthenticationError,
  AuthorizationError,
  InternalServerException,
  ExternalServiceError,
  ValidationException,
};

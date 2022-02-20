import HttpStatusCode from "../constants/http-status-codes.constants";

export abstract class BaseServerError extends Error {
    statusCode: number;

    protected constructor(message = "") {
        super(message);
    }
}

export class NotImplementedException extends BaseServerError {
    constructor(message = "") {
        super(message);
        this.name = NotImplementedException.name;
    }
}

export class AuthenticationError extends BaseServerError {
    constructor(error, statusCode = HttpStatusCode.UNAUTHORIZED) {
        super(error);
        this.statusCode = statusCode;
        this.name = AuthenticationError.name;
    }
}

export class AuthorizationError extends BaseServerError {
    constructor(criterium) {
        super(`Authorization failed ${criterium.toString()}`);
        this.name = AuthorizationError.name;
    }
}

export class NotFoundException extends BaseServerError {
    path: string;

    constructor(message, path = "") {
        super(message);
        this.name = NotFoundException.name;
        this.path = path;
    }
}

export class ValidationException extends BaseServerError {
    errors: any;

    constructor(validationObject) {
        super(JSON.stringify(validationObject));
        this.name = ValidationException.name;
        this.errors = validationObject;
    }
}

export class ExternalServiceError extends BaseServerError {
    error: any;

    constructor(responseObject) {
        super(JSON.stringify(responseObject));
        this.name = ExternalServiceError.name;
        this.error = responseObject;
    }
}

export class InternalServerException extends BaseServerError {
    constructor(message, stack = null) {
        super(message);
        this.name = InternalServerException.name;
        this.stack = stack;
    }
}
export type ApplicationErrorCode =
  | 'RESOURCE_NOT_FOUND'
  | 'VALIDATION'
  | 'BUSINESS_RULE_VIOLATION'
  | 'UNAUTHORIZED'
  | 'CONFLICT';

export type FieldValidationError = {
  field: string;
  message: string;
};

export abstract class ApplicationError extends Error {
  protected constructor(
    message: string,
    public readonly code: ApplicationErrorCode,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ResourceNotFoundError extends ApplicationError {
  constructor(message = 'Resource not found') {
    super(message, 'RESOURCE_NOT_FOUND');
  }
}

export class ValidationError extends ApplicationError {
  constructor(
    message = 'Validation failed',
    public readonly errors: FieldValidationError[] = [],
  ) {
    super(message, 'VALIDATION');
  }
}

export class BusinessRuleViolationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED');
  }
}

export class ConflictError extends ApplicationError {
  constructor(message = 'Conflict') {
    super(message, 'CONFLICT');
  }
}

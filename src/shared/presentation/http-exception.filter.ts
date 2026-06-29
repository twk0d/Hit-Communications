import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

import { ApplicationError, ValidationError } from '../application/errors/application.error';

const applicationErrorStatus: Record<ApplicationError['code'], number> = {
  RESOURCE_NOT_FOUND: 404,
  VALIDATION: 422,
  BUSINESS_RULE_VIOLATION: 422,
  UNAUTHORIZED: 401,
  CONFLICT: 409,
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      response.status(statusCode).json(
        typeof exceptionResponse === 'string'
          ? {
              statusCode,
              message: exceptionResponse,
            }
          : exceptionResponse,
      );
      return;
    }

    if (exception instanceof ApplicationError) {
      const statusCode = applicationErrorStatus[exception.code];

      response.status(statusCode).json({
        statusCode,
        message: exception.message,
        ...(exception instanceof ValidationError && exception.errors.length > 0
          ? { errors: exception.errors }
          : {}),
      });
      return;
    }

    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}

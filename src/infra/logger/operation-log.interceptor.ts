import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IncomingMessage } from 'node:http';
import { PinoLogger } from 'nestjs-pino';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { ApplicationError } from '../../shared/application/errors/application.error';
import { LOG_OPERATION_METADATA } from '../../shared/presentation/logging/log-operation.decorator';

type RequestUserContext = {
  id?: string;
  role?: string;
};

type RequestWithOperationContext = IncomingMessage & {
  body?: Record<string, unknown>;
  id?: string | number;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  user?: RequestUserContext;
};

type OperationResultContext = Record<string, unknown>;

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OperationLogInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const operation = this.reflector.getAllAndOverride<string>(LOG_OPERATION_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!operation || context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithOperationContext>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap((result: unknown) => {
        this.logger.info(
          buildOperationLogContext(operation, request, result, Date.now() - startedAt),
          `${operation} completed`,
        );
      }),
      catchError((error: unknown) => {
        const logContext = {
          ...buildOperationLogContext(operation, request, undefined, Date.now() - startedAt),
          errorName: getErrorName(error),
          errorMessage: getErrorMessage(error),
        };

        if (isExpectedError(error)) {
          this.logger.warn(logContext, `${operation} rejected`);
        } else {
          this.logger.error(
            {
              ...logContext,
              errorStack: error instanceof Error ? error.stack : undefined,
            },
            `${operation} failed`,
          );
        }

        return throwError(() => error);
      }),
    );
  }
}

function buildOperationLogContext(
  operation: string,
  request: RequestWithOperationContext,
  result: unknown,
  durationMs: number,
): Record<string, unknown> {
  const resultContext = asRecord(result);

  return removeUndefined({
    operation,
    requestId: request.id,
    method: request.method,
    path: request.url,
    userId: request.user?.id,
    userRole: request.user?.role,
    durationMs,
    incidentId: getIncidentId(operation, request, resultContext),
    assigneeId: getAssigneeId(operation, request, resultContext),
    changedById: getChangedById(operation, request),
    targetUserId: getTargetUserId(operation, resultContext),
    status: getString(resultContext?.status) ?? getString(request.body?.status),
    priority: getString(resultContext?.priority) ?? getString(request.body?.priority),
    category: getString(resultContext?.category) ?? getString(request.body?.category),
  });
}

function getIncidentId(
  operation: string,
  request: RequestWithOperationContext,
  result: OperationResultContext | undefined,
): string | undefined {
  if (!operation.startsWith('incident.')) {
    return undefined;
  }

  return (
    getString(request.params?.id) ?? getString(result?.id) ?? getString(result?.incidentId)
  );
}

function getAssigneeId(
  operation: string,
  request: RequestWithOperationContext,
  result: OperationResultContext | undefined,
): string | undefined {
  if (!operation.startsWith('incident.')) {
    return undefined;
  }

  return getString(result?.assigneeId) ?? getString(request.body?.assigneeId);
}

function getChangedById(
  operation: string,
  request: RequestWithOperationContext,
): string | undefined {
  if (
    operation !== 'incident.update' &&
    operation !== 'incident.resolve' &&
    operation !== 'incident.softDelete'
  ) {
    return undefined;
  }

  return request.user?.id;
}

function getTargetUserId(
  operation: string,
  result: OperationResultContext | undefined,
): string | undefined {
  if (operation === 'auth.login') {
    return getString(asRecord(result?.user)?.id);
  }

  if (operation === 'auth.register' || operation.startsWith('users.')) {
    return getString(result?.id);
  }

  return undefined;
}

function isExpectedError(error: unknown): boolean {
  if (error instanceof ApplicationError) {
    return true;
  }

  if (error instanceof HttpException) {
    return error.getStatus() < 500;
  }

  return false;
}

function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function asRecord(value: unknown): OperationResultContext | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as OperationResultContext;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function removeUndefined(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

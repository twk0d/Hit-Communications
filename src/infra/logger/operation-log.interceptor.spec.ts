import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { lastValueFrom, of, throwError } from 'rxjs';

import { BusinessRuleViolationError } from '../../shared/application/errors/application.error';
import { OperationLogInterceptor } from './operation-log.interceptor';

function makeReflector(operation?: string): Reflector {
  return {
    getAllAndOverride: jest.fn(() => operation),
  } as unknown as Reflector;
}

function makeLogger(): PinoLogger {
  return {
    error: jest.fn(),
    info: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;
}

function makeContext(request: Record<string, unknown> = {}): ExecutionContext {
  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getType: jest.fn(() => 'http'),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        method: 'PATCH',
        params: {},
        url: '/api/v1/incidents/incident-id/resolve',
        ...request,
      }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(result: unknown): CallHandler {
  return {
    handle: () => of(result),
  };
}

describe('OperationLogInterceptor', () => {
  it('logs annotated operations with safe correlation fields', async () => {
    const logger = makeLogger();
    const interceptor = new OperationLogInterceptor(makeReflector('incident.resolve'), logger);

    await lastValueFrom(
      interceptor.intercept(
        makeContext({
          id: 'request-id',
          params: {
            id: 'incident-id',
          },
          user: {
            id: 'user-id',
            role: 'USER',
          },
        }),
        makeHandler({
          id: 'incident-id',
          assigneeId: 'assignee-id',
          status: 'RESOLVED',
        }),
      ),
    );

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        assigneeId: 'assignee-id',
        changedById: 'user-id',
        incidentId: 'incident-id',
        operation: 'incident.resolve',
        requestId: 'request-id',
        status: 'RESOLVED',
        userId: 'user-id',
        userRole: 'USER',
      }),
      'incident.resolve completed',
    );
  });

  it('does not log routes without operation metadata', async () => {
    const logger = makeLogger();
    const interceptor = new OperationLogInterceptor(makeReflector(), logger);

    await lastValueFrom(interceptor.intercept(makeContext(), makeHandler({ id: 'id' })));

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs expected application errors as warn and rethrows', async () => {
    const logger = makeLogger();
    const interceptor = new OperationLogInterceptor(makeReflector('incident.resolve'), logger);
    const error = new BusinessRuleViolationError('Incident is already resolved');

    await expect(
      lastValueFrom(
        interceptor.intercept(makeContext(), {
          handle: () => throwError(() => error),
        }),
      ),
    ).rejects.toBe(error);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'Incident is already resolved',
        errorName: 'BusinessRuleViolationError',
        operation: 'incident.resolve',
      }),
      'incident.resolve rejected',
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});

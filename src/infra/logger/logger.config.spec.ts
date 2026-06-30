import { ConfigService } from '@nestjs/config';

import { LOGGER_REDACTION_CENSOR, LOGGER_REDACTION_PATHS } from './logger-redaction';
import { createPinoHttpOptions } from './logger.config';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('createPinoHttpOptions', () => {
  it('uses silent logs during tests unless LOG_LEVEL is explicitly configured', () => {
    const options = createPinoHttpOptions(
      makeConfig({
        NODE_ENV: 'test',
        LOG_FORMAT: 'pretty',
      }),
    );

    expect(options.level).toBe('silent');
    expect(options.transport).toBeUndefined();
  });

  it('enables pino-pretty only for explicit local development logs', () => {
    const options = createPinoHttpOptions(
      makeConfig({
        NODE_ENV: 'development',
        LOG_FORMAT: 'pretty',
      }),
    );

    expect(options.transport).toEqual({
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        singleLine: false,
        translateTime: 'SYS:standard',
      },
    });
  });

  it('keeps JSON logs as the default outside local development', () => {
    const productionOptions = createPinoHttpOptions(
      makeConfig({
        NODE_ENV: 'production',
        LOG_FORMAT: 'pretty',
      }),
    );
    const developmentJsonOptions = createPinoHttpOptions(
      makeConfig({
        NODE_ENV: 'development',
        LOG_FORMAT: 'json',
      }),
    );

    expect(productionOptions.transport).toBeUndefined();
    expect(developmentJsonOptions.transport).toBeUndefined();
  });

  it('keeps sensitive fields redacted from structured logs', () => {
    const options = createPinoHttpOptions(
      makeConfig({
        NODE_ENV: 'production',
      }),
    );

    expect(options.redact).toEqual({
      paths: [...LOGGER_REDACTION_PATHS],
      censor: LOGGER_REDACTION_CENSOR,
    });
    expect(LOGGER_REDACTION_PATHS).toEqual(
      expect.arrayContaining([
        'req.headers.authorization',
        'req.body.password',
        'req.body.accessToken',
        'passwordHash',
        'JWT_SECRET',
      ]),
    );
  });

  it('marks client and server failures with appropriate log levels', () => {
    const options = createPinoHttpOptions(makeConfig({}));

    expect(options.customLogLevel?.({} as never, { statusCode: 200 } as never)).toBe('info');
    expect(options.customLogLevel?.({} as never, { statusCode: 422 } as never)).toBe('warn');
    expect(options.customLogLevel?.({} as never, { statusCode: 500 } as never)).toBe('error');
    expect(
      options.customLogLevel?.({} as never, { statusCode: 200 } as never, new Error('boom')),
    ).toBe('error');
  });

  it('keeps statusCode available as a top-level log field for Loki queries', () => {
    const options = createPinoHttpOptions(makeConfig({}));

    expect(
      options.customSuccessObject?.({} as never, { statusCode: 201 } as never, {
        requestId: 'request-id',
      }),
    ).toEqual({
      requestId: 'request-id',
      statusCode: 201,
    });
    expect(
      options.customErrorObject?.(
        {} as never,
        { statusCode: 500 } as never,
        new Error('boom'),
        {
          requestId: 'request-id',
        },
      ),
    ).toEqual({
      errorMessage: 'boom',
      errorName: 'Error',
      requestId: 'request-id',
      statusCode: 500,
    });
  });
});

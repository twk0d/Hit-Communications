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
      }),
    );

    expect(options.level).toBe('silent');
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
});

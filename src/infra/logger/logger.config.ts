import { ConfigService } from '@nestjs/config';
import { IncomingMessage } from 'node:http';
import { Options } from 'pino-http';

import { LOGGER_REDACTION_CENSOR, LOGGER_REDACTION_PATHS } from './logger-redaction';
import { resolveRequestId } from './request-id';

type RequestUserContext = {
  id?: string;
  role?: string;
};

type RequestWithLogContext = IncomingMessage & {
  id?: string | number;
  user?: RequestUserContext;
};

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

const supportedLogLevels = new Set<LogLevel>([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
]);

export function createPinoHttpOptions(configService: ConfigService): Options {
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const logFormat = configService.get<string>('LOG_FORMAT');

  return {
    level: getLogLevel(configService.get<string>('LOG_LEVEL'), nodeEnv),
    ...getLogTransport(logFormat, nodeEnv),
    genReqId: resolveRequestId,
    customAttributeKeys: {
      reqId: 'requestId',
      responseTime: 'responseTimeMs',
    },
    redact: {
      paths: [...LOGGER_REDACTION_PATHS],
      censor: LOGGER_REDACTION_CENSOR,
    },
    customLogLevel: (_req, res, error) => {
      if (error || res.statusCode >= 500) {
        return 'error';
      }

      if (res.statusCode >= 400) {
        return 'warn';
      }

      return 'info';
    },
    customProps: (req, _res) => buildRequestLogContext(req as RequestWithLogContext),
    customSuccessObject: (_req, res, value) => ({
      ...asLogObject(value),
      statusCode: res.statusCode,
    }),
    customErrorObject: (_req, res, error, value) => ({
      ...asLogObject(value),
      statusCode: res.statusCode,
      errorName: error.name,
      errorMessage: error.message,
    }),
    customSuccessMessage: (req) => `${req.method ?? 'HTTP'} ${req.url ?? ''} completed`,
    customErrorMessage: (req) => `${req.method ?? 'HTTP'} ${req.url ?? ''} failed`,
  };
}

function getLogTransport(
  configuredFormat: string | undefined,
  nodeEnv: string,
): Pick<Options, 'transport'> {
  const normalizedFormat = configuredFormat?.trim().toLowerCase();

  if (nodeEnv !== 'development' || normalizedFormat !== 'pretty') {
    return {};
  }

  return {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        singleLine: false,
        translateTime: 'SYS:standard',
      },
    },
  };
}

function buildRequestLogContext(req: RequestWithLogContext): Record<string, unknown> {
  return {
    requestId: req.id,
    method: req.method,
    path: req.url,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: getClientIp(req),
    userAgent: getHeaderValue(req.headers['user-agent']),
  };
}

function getLogLevel(configuredLevel: string | undefined, nodeEnv: string): LogLevel {
  const normalizedLevel = configuredLevel?.trim().toLowerCase();

  if (normalizedLevel && supportedLogLevels.has(normalizedLevel as LogLevel)) {
    return normalizedLevel as LogLevel;
  }

  if (nodeEnv === 'test') {
    return 'silent';
  }

  if (nodeEnv === 'development') {
    return 'debug';
  }

  return 'info';
}

function getClientIp(req: IncomingMessage): string | undefined {
  return getHeaderValue(req.headers['x-forwarded-for']) ?? req.socket.remoteAddress;
}

function getHeaderValue(header: string | string[] | undefined): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;
  const normalizedValue = value?.trim();

  return normalizedValue || undefined;
}

function asLogObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

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

  return {
    level: getLogLevel(configService.get<string>('LOG_LEVEL'), nodeEnv),
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
    customSuccessMessage: (req) => `${req.method ?? 'HTTP'} ${req.url ?? ''} completed`,
    customErrorMessage: (req) => `${req.method ?? 'HTTP'} ${req.url ?? ''} failed`,
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

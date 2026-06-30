import { randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';

export const REQUEST_ID_HEADER = 'x-request-id';

const MAX_REQUEST_ID_LENGTH = 200;

export function resolveRequestId(req: IncomingMessage, res: ServerResponse): string {
  const requestId = getRequestIdFromHeader(req.headers[REQUEST_ID_HEADER]) ?? randomUUID();

  res.setHeader(REQUEST_ID_HEADER, requestId);

  return requestId;
}

export function getRequestIdFromHeader(header: string | string[] | undefined): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;
  const normalizedValue = value?.trim();

  if (!normalizedValue || normalizedValue.length > MAX_REQUEST_ID_LENGTH) {
    return undefined;
  }

  return normalizedValue;
}

import { IncomingMessage, ServerResponse } from 'node:http';

import { REQUEST_ID_HEADER, getRequestIdFromHeader, resolveRequestId } from './request-id';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function makeResponse(): ServerResponse {
  return {
    setHeader: jest.fn(),
  } as unknown as ServerResponse;
}

describe('resolveRequestId', () => {
  it('reuses an inbound x-request-id and returns it on the response header', () => {
    const request = {
      headers: {
        [REQUEST_ID_HEADER]: 'external-request-id',
      },
    } as unknown as IncomingMessage;
    const response = makeResponse();

    const requestId = resolveRequestId(request, response);

    expect(requestId).toBe('external-request-id');
    expect(response.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'external-request-id');
  });

  it('generates a UUID when the inbound request id is absent', () => {
    const request = {
      headers: {},
    } as IncomingMessage;
    const response = makeResponse();

    const requestId = resolveRequestId(request, response);

    expect(requestId).toMatch(uuidRegex);
    expect(response.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, requestId);
  });
});

describe('getRequestIdFromHeader', () => {
  it('uses the first header value and ignores empty or too large values', () => {
    expect(getRequestIdFromHeader([' first ', 'second'])).toBe('first');
    expect(getRequestIdFromHeader('   ')).toBeUndefined();
    expect(getRequestIdFromHeader('x'.repeat(201))).toBeUndefined();
  });
});

import { ArgumentsHost } from '@nestjs/common';

import { ValidationError } from '../application/errors/application.error';
import { HttpExceptionFilter } from './http-exception.filter';

function makeHost() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return {
    host,
    response,
  };
}

describe('HttpExceptionFilter', () => {
  it('maps ValidationError to the approved 422 response shape with field errors', () => {
    const filter = new HttpExceptionFilter();
    const { host, response } = makeHost();

    filter.catch(
      new ValidationError([
        {
          field: 'title',
          message: 'Title is required',
        },
      ]),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 422,
      message: 'Validation failed',
      errors: [
        {
          field: 'title',
          message: 'Title is required',
        },
      ],
    });
  });

  it('keeps the approved validation shape when there are no field errors', () => {
    const filter = new HttpExceptionFilter();
    const { host, response } = makeHost();

    filter.catch(new ValidationError([]), host);

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 422,
      message: 'Validation failed',
      errors: [],
    });
  });
});

import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const validationErrorSchema: SchemaObject = {
  type: 'object',
  required: ['statusCode', 'message', 'errors'],
  properties: {
    statusCode: {
      type: 'integer',
      example: 422,
    },
    message: {
      type: 'string',
      example: 'Validation failed',
    },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        required: ['field', 'message'],
        properties: {
          field: {
            type: 'string',
            example: 'email',
          },
          message: {
            type: 'string',
            example: 'Email must be valid',
          },
        },
      },
    },
  },
};

export const applicationErrorSchema: SchemaObject = {
  type: 'object',
  required: ['statusCode', 'message'],
  properties: {
    statusCode: {
      type: 'integer',
      example: 404,
    },
    message: {
      type: 'string',
      example: 'Resource not found',
    },
  },
};

export const unauthorizedErrorExample = {
  statusCode: 401,
  message: 'Unauthorized',
};

export const invalidIncidentUuidValidationExample = {
  statusCode: 422,
  message: 'Validation failed',
  errors: [
    {
      field: 'id',
      message: 'Incident id must be a valid UUID',
    },
  ],
};

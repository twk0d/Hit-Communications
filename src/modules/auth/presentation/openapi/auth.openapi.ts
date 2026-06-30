import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { userExample, userSchema } from '../../../users/presentation/openapi/users.openapi';

export const registerRequestExample = {
  name: 'HIT User',
  email: 'user@hit.local',
  password: 'StrongPass123',
};

export const registerRequestSchema: SchemaObject = {
  type: 'object',
  required: ['name', 'email', 'password'],
  properties: {
    name: {
      type: 'string',
      minLength: 2,
      maxLength: 120,
      example: registerRequestExample.name,
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
      example: registerRequestExample.email,
    },
    password: {
      type: 'string',
      format: 'password',
      minLength: 8,
      maxLength: 72,
      example: registerRequestExample.password,
    },
  },
};

export const loginRequestExample = {
  email: 'user@hit.local',
  password: 'StrongPass123',
};

export const loginRequestSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
      example: loginRequestExample.email,
    },
    password: {
      type: 'string',
      format: 'password',
      minLength: 1,
      maxLength: 72,
      example: loginRequestExample.password,
    },
  },
};

export const authExample = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.signature',
  tokenType: 'Bearer',
  user: userExample,
};

export const authSchema: SchemaObject = {
  type: 'object',
  required: ['accessToken', 'tokenType', 'user'],
  properties: {
    accessToken: {
      type: 'string',
      example: authExample.accessToken,
    },
    tokenType: {
      type: 'string',
      enum: ['Bearer'],
      example: authExample.tokenType,
    },
    user: userSchema,
  },
};

export const authValidationErrorExample = {
  statusCode: 422,
  message: 'Validation failed',
  errors: [
    {
      field: 'email',
      message: 'Email must be valid',
    },
    {
      field: 'password',
      message: 'Password must be at most 72 characters',
    },
  ],
};

export const registerConflictErrorExample = {
  statusCode: 409,
  message: 'Email already in use',
};

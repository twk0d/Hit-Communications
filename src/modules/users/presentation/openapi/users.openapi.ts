import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { UserRole } from '../../domain/enums/user-role.enum';

export const userExample = {
  id: '356b57c6-9b8a-4576-8df6-cbd9799d8295',
  name: 'HIT User',
  email: 'user@hit.local',
  role: UserRole.USER,
  createdAt: '2026-06-29T12:00:00.000Z',
  updatedAt: '2026-06-29T12:00:00.000Z',
};

export const adminUserExample = {
  id: 'cf859f02-e83f-4b78-8f5b-6944ca5fd38a',
  name: 'HIT Admin',
  email: 'admin@hit.local',
  role: UserRole.ADMIN,
  createdAt: '2026-06-29T12:00:00.000Z',
  updatedAt: '2026-06-29T12:00:00.000Z',
};

export const userSchema: SchemaObject = {
  type: 'object',
  required: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      example: userExample.id,
    },
    name: {
      type: 'string',
      example: userExample.name,
    },
    email: {
      type: 'string',
      format: 'email',
      example: userExample.email,
    },
    role: {
      type: 'string',
      enum: Object.values(UserRole),
      example: userExample.role,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: userExample.createdAt,
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: userExample.updatedAt,
    },
  },
};

export const invalidUserUuidValidationExample = {
  statusCode: 422,
  message: 'Validation failed',
  errors: [
    {
      field: 'id',
      message: 'User id must be a valid UUID',
    },
  ],
};

export const userNotFoundErrorExample = {
  statusCode: 404,
  message: 'User not found',
};

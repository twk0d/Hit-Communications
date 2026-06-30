import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { userExample } from '../../../users/presentation/openapi/users.openapi';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';
import { updatableIncidentStatusValues } from '../dtos/update-incident.dto';

export const incidentExample = {
  id: '8d843a6e-8929-44a8-8ccb-41c52773f6b1',
  title: 'VPN unavailable',
  description: 'Users cannot connect to the VPN gateway.',
  category: IncidentCategory.NETWORK,
  priority: IncidentPriority.HIGH,
  status: IncidentStatus.OPEN,
  assigneeId: userExample.id,
  createdAt: '2026-06-29T12:00:00.000Z',
  updatedAt: '2026-06-29T12:00:00.000Z',
  resolvedAt: null,
};

export const resolvedIncidentExample = {
  ...incidentExample,
  status: IncidentStatus.RESOLVED,
  updatedAt: '2026-06-29T13:00:00.000Z',
  resolvedAt: '2026-06-29T13:00:00.000Z',
};

export const createIncidentRequestExample = {
  title: incidentExample.title,
  description: incidentExample.description,
  category: incidentExample.category,
  priority: incidentExample.priority,
  assigneeId: incidentExample.assigneeId,
};

export const updateIncidentRequestExample = {
  title: 'VPN degraded',
  description: 'VPN access is unstable for remote users.',
  priority: IncidentPriority.CRITICAL,
  assigneeId: userExample.id,
  status: IncidentStatus.IN_PROGRESS,
};

export const updatedIncidentExample = {
  ...incidentExample,
  ...updateIncidentRequestExample,
  updatedAt: '2026-06-29T13:00:00.000Z',
};

export const incidentSchema: SchemaObject = {
  type: 'object',
  required: [
    'id',
    'title',
    'description',
    'category',
    'priority',
    'status',
    'assigneeId',
    'createdAt',
    'updatedAt',
    'resolvedAt',
  ],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      example: incidentExample.id,
    },
    title: {
      type: 'string',
      example: incidentExample.title,
    },
    description: {
      type: 'string',
      example: incidentExample.description,
    },
    category: {
      type: 'string',
      enum: Object.values(IncidentCategory),
      example: incidentExample.category,
    },
    priority: {
      type: 'string',
      enum: Object.values(IncidentPriority),
      example: incidentExample.priority,
    },
    status: {
      type: 'string',
      enum: Object.values(IncidentStatus),
      example: incidentExample.status,
    },
    assigneeId: {
      type: 'string',
      format: 'uuid',
      example: incidentExample.assigneeId,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: incidentExample.createdAt,
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: incidentExample.updatedAt,
    },
    resolvedAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      example: incidentExample.resolvedAt,
    },
  },
};

export const createIncidentRequestSchema: SchemaObject = {
  type: 'object',
  required: ['title', 'description', 'category', 'priority', 'assigneeId'],
  properties: {
    title: {
      type: 'string',
      minLength: 3,
      maxLength: 160,
      example: createIncidentRequestExample.title,
    },
    description: {
      type: 'string',
      minLength: 10,
      maxLength: 2000,
      example: createIncidentRequestExample.description,
    },
    category: {
      type: 'string',
      enum: Object.values(IncidentCategory),
      example: createIncidentRequestExample.category,
    },
    priority: {
      type: 'string',
      enum: Object.values(IncidentPriority),
      example: createIncidentRequestExample.priority,
    },
    assigneeId: {
      type: 'string',
      format: 'uuid',
      example: createIncidentRequestExample.assigneeId,
    },
  },
};

export const updateIncidentRequestSchema: SchemaObject = {
  type: 'object',
  minProperties: 1,
  properties: {
    title: {
      type: 'string',
      minLength: 3,
      maxLength: 160,
      example: updateIncidentRequestExample.title,
    },
    description: {
      type: 'string',
      minLength: 10,
      maxLength: 2000,
      example: updateIncidentRequestExample.description,
    },
    priority: {
      type: 'string',
      enum: Object.values(IncidentPriority),
      example: updateIncidentRequestExample.priority,
    },
    assigneeId: {
      type: 'string',
      format: 'uuid',
      example: updateIncidentRequestExample.assigneeId,
    },
    status: {
      type: 'string',
      enum: [...updatableIncidentStatusValues],
      example: updateIncidentRequestExample.status,
    },
  },
};

export const paginatedIncidentsExample = {
  data: [incidentExample],
  meta: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
};

export const paginatedIncidentsSchema: SchemaObject = {
  type: 'object',
  required: ['data', 'meta'],
  properties: {
    data: {
      type: 'array',
      items: incidentSchema,
    },
    meta: {
      type: 'object',
      required: ['page', 'limit', 'total', 'totalPages'],
      properties: {
        page: {
          type: 'integer',
          example: paginatedIncidentsExample.meta.page,
        },
        limit: {
          type: 'integer',
          example: paginatedIncidentsExample.meta.limit,
        },
        total: {
          type: 'integer',
          example: paginatedIncidentsExample.meta.total,
        },
        totalPages: {
          type: 'integer',
          example: paginatedIncidentsExample.meta.totalPages,
        },
      },
    },
  },
};

export const incidentHistoryExample = {
  id: '9681cfe6-ed3b-463d-a868-e9a38bd8cff9',
  incidentId: incidentExample.id,
  field: 'status',
  oldValue: IncidentStatus.OPEN,
  newValue: IncidentStatus.IN_PROGRESS,
  changedById: userExample.id,
  changedAt: '2026-06-29T13:00:00.000Z',
};

export const incidentHistorySchema: SchemaObject = {
  type: 'object',
  required: [
    'id',
    'incidentId',
    'field',
    'oldValue',
    'newValue',
    'changedById',
    'changedAt',
  ],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      example: incidentHistoryExample.id,
    },
    incidentId: {
      type: 'string',
      format: 'uuid',
      example: incidentHistoryExample.incidentId,
    },
    field: {
      type: 'string',
      example: incidentHistoryExample.field,
    },
    oldValue: {
      type: 'string',
      nullable: true,
      example: incidentHistoryExample.oldValue,
    },
    newValue: {
      type: 'string',
      nullable: true,
      example: incidentHistoryExample.newValue,
    },
    changedById: {
      type: 'string',
      format: 'uuid',
      example: incidentHistoryExample.changedById,
    },
    changedAt: {
      type: 'string',
      format: 'date-time',
      example: incidentHistoryExample.changedAt,
    },
  },
};

export const incidentValidationErrorExample = {
  statusCode: 422,
  message: 'Validation failed',
  errors: [
    {
      field: 'title',
      message: 'Title must be at least 3 characters',
    },
    {
      field: 'assigneeId',
      message: 'Assignee id must be a valid UUID',
    },
  ],
};

export const incidentNotFoundErrorExample = {
  statusCode: 404,
  message: 'Incident not found',
};

export const assigneeNotFoundErrorExample = {
  statusCode: 404,
  message: 'Assignee not found',
};

export const incidentAlreadyResolvedErrorExample = {
  statusCode: 422,
  message: 'Incident is already resolved',
};

export const resolvedIncidentUpdateErrorExample = {
  statusCode: 422,
  message: 'Resolved incident cannot be updated',
};

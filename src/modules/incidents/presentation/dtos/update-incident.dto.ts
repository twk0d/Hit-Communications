import { z } from 'zod';

import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';

export const updatableIncidentStatusValues = [
  IncidentStatus.OPEN,
  IncidentStatus.IN_PROGRESS,
  IncidentStatus.CANCELED,
] as const;

export type UpdateIncidentStatus = (typeof updatableIncidentStatusValues)[number];

export const updateIncidentSchema = z
  .object({
    title: z
      .string({
        invalid_type_error: 'Title must be a string',
      })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(160, 'Title must be at most 160 characters')
      .optional(),
    description: z
      .string({
        invalid_type_error: 'Description must be a string',
      })
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description must be at most 2000 characters')
      .optional(),
    priority: z
      .nativeEnum(IncidentPriority, {
        invalid_type_error: 'Priority must be a valid incident priority',
      })
      .optional(),
    assigneeId: z
      .string({
        invalid_type_error: 'Assignee id must be a valid UUID',
      })
      .uuid('Assignee id must be a valid UUID')
      .optional(),
    status: z
      .string({
        invalid_type_error: 'Status must be OPEN, IN_PROGRESS or CANCELED',
      })
      .refine(
        (value): value is UpdateIncidentStatus =>
          updatableIncidentStatusValues.includes(value as UpdateIncidentStatus),
        'Status must be OPEN, IN_PROGRESS or CANCELED',
      )
      .optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    if (
      body.title === undefined &&
      body.description === undefined &&
      body.priority === undefined &&
      body.assigneeId === undefined &&
      body.status === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body'],
        message: 'At least one field must be provided',
      });
    }
  });

export class UpdateIncidentDto {
  static readonly schema = updateIncidentSchema;

  title?: string;
  description?: string;
  priority?: IncidentPriority;
  assigneeId?: string;
  status?: UpdateIncidentStatus;
}
